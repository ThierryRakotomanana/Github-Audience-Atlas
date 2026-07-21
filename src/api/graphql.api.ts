import { graphql as githubGraphql, GraphqlResponseError } from "@octokit/graphql";
import type {
	AllAudienceResult,
	AudienceType,
	AudiencePageResult,
	GithubProfileNode,
	RateLimit,
	RawAudienceQueryResponse,
	RawUserProfileQueryResponse,
	UserProfileResult
} from "./graphql.types";
import {
	AllTokensExhaustedError,
	resetAtFromHeaders,
	TokenPool,
	withTokenRotation
} from "@/api/token-pool";

export interface CostEstimate {
	pointsNeeded: number;
	remaining: number;
	willExceed: boolean;
}

export class GithubApiError extends Error {
	constructor(
		message: string,
		public readonly status?: number
	) {
		super(message);
		this.name = "GithubApiError";
	}
}

export class RateLimitError extends Error {
	constructor(
		public resetAt: Date,
		public partialNodes: GithubProfileNode[] = []
	) {
		super(`Rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}.`);
		this.name = "RateLimitError";
	}
}

const GITHUB_MAX_PAGE_SIZE = 100;
const QUOTA_BUFFER_RATIO = 0.02;

export function quotaBuffer(rateLimit: RateLimit): number {
	return Math.max(Math.ceil(rateLimit.limit * QUOTA_BUFFER_RATIO), 1);
}

export function isQuotaLow(rateLimit: RateLimit): boolean {
	return rateLimit.remaining <= quotaBuffer(rateLimit);
}

const PROFILE_FRAGMENT = `
    fragment ProfileFields on User {
        login
        id
        name
        avatarUrl
        url
        company
        location
        twitterUsername
        isSiteAdmin
    }
`;

const RATE_LIMIT_FIELDS = `
    rateLimit {
        limit
        cost
        remaining
        resetAt
    }
`;

const audienceQueryCache = new Map<AudienceType, string>();

function buildAudienceQuery(audienceType: AudienceType): string {
	const cached = audienceQueryCache.get(audienceType);
	if (cached) return cached;

	const query = `
        ${PROFILE_FRAGMENT}
        query AudiencePage($login: String!, $first: Int!, $after: String) {
            user(login: $login) {
                login
                ${audienceType}(first: $first, after: $after) {
                    totalCount
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    nodes {
                        ...ProfileFields
                    }
                }
            }
            ${RATE_LIMIT_FIELDS}
        }
    `;
	audienceQueryCache.set(audienceType, query);
	return query;
}

const USER_PROFILE_QUERY = `
    ${PROFILE_FRAGMENT}
    query UserProfile($login: String!) {
        user(login: $login) {
            ...ProfileFields
            followers {
                totalCount
            }
            following {
                totalCount
            }
        }
        ${RATE_LIMIT_FIELDS}
    }
`;

function createClient(token: string, signal?: AbortSignal) {
	return githubGraphql.defaults({
		headers: { authorization: `token ${token}` },
		request: { signal }
	});
}

function toGithubApiError(error: unknown, login: string): Error {
	if (error instanceof GraphqlResponseError) {
		const notFound = error.errors?.some((e) => e.type === "NOT_FOUND");
		if (notFound) return new GithubApiError(`User not found: ${login}`, 404);
		return new GithubApiError(error.errors?.[0]?.message ?? error.message);
	}
	if (error && typeof error === "object" && "status" in error) {
		const status = (error as { status?: number }).status;
		if (status === 401)
			return new GithubApiError("Invalid or expired GitHub token.", 401);
		if (status === 403)
			return new GithubApiError("GitHub API rate limit exceeded.", 403);
		return new GithubApiError(`GitHub API error: ${status}`, status);
	}
	return error instanceof Error ? error : (
			new GithubApiError("Unknown GitHub API error.")
		);
}

export const fetchUserProfile = async (
	login: string,
	pool: TokenPool,
	signal?: AbortSignal
): Promise<UserProfileResult> => {
	let result: RawUserProfileQueryResponse;
	try {
		result = await withTokenRotation(
			pool,
			async (token) => {
				const client = createClient(token, signal);
				const res = await client<RawUserProfileQueryResponse>(USER_PROFILE_QUERY, {
					login
				});
				pool.report(token, toRateLimitSnapshot(res.rateLimit));
				return res;
			},
			classifyGraphqlRateLimitError
		);
	} catch (error) {
		if (error instanceof AllTokensExhaustedError) throw error;
		throw toGithubApiError(error, login);
	}

	if (!result.user) throw new GithubApiError(`User not found: ${login}`, 404);
	const { followers, following, ...rest } = result.user;
	return {
		profile: {
			...rest,
			followersCount: followers.totalCount,
			followingCount: following.totalCount
		},
		rateLimit: result.rateLimit
	};
};

export const fetchAudiencePage = async (
	login: string,
	audienceType: AudienceType,
	pool: TokenPool,
	options: { first?: number; after?: string | null; signal?: AbortSignal } = {}
): Promise<AudiencePageResult> => {
	const { after = null, signal } = options;
	const first = Math.min(
		Math.max(options.first ?? GITHUB_MAX_PAGE_SIZE, 1),
		GITHUB_MAX_PAGE_SIZE
	);
	const query = buildAudienceQuery(audienceType);

	let result: RawAudienceQueryResponse;
	try {
		result = await withTokenRotation(
			pool,
			async (token) => {
				const client = createClient(token, signal);
				const res = await client<RawAudienceQueryResponse>(query, {
					login,
					first,
					after
				});
				pool.report(token, toRateLimitSnapshot(res.rateLimit));
				return res;
			},
			classifyGraphqlRateLimitError
		);
	} catch (error) {
		if (error instanceof AllTokensExhaustedError) throw error;
		throw toGithubApiError(error, login);
	}

	if (!result.user) throw new GithubApiError(`User not found: ${login}`, 404);
	const audience = result.user[audienceType];
	if (!audience)
		throw new GithubApiError(
			`GitHub returned no ${audienceType} data for user "${login}" (the account may be suspended, blocked, or otherwise restricted).`
		);
	return { login: result.user.login, audience, rateLimit: result.rateLimit };
};

export const fetchAllAudience = async (
	login: string,
	audienceType: AudienceType,
	pool: TokenPool,
	onProgress?: (done: number, total: number) => void,
	signal?: AbortSignal
): Promise<AllAudienceResult> => {
	const collected = new Map<string, GithubProfileNode>();
	let after: string | null = null;
	let totalCount: number;

	while (true) {
		let audience;
		try {
			({ audience } = await fetchAudiencePage(login, audienceType, pool, {
				after,
				signal
			}));
		} catch (error) {
			if (error instanceof AllTokensExhaustedError) {
				throw new RateLimitError(error.resetAt, [...collected.values()]);
			}
			throw error;
		}

		for (const node of audience.nodes) collected.set(node.id, node);
		totalCount = audience.totalCount;
		onProgress?.(collected.size, totalCount);

		const nextCursor = audience.pageInfo.endCursor;
		const cursorAdvanced = nextCursor !== null && nextCursor !== after;
		if (!cursorAdvanced) {
			if (audience.pageInfo.hasNextPage) {
				console.warn(
					`[github-audience] ${audienceType} page for "${login}" reported hasNextPage=true with a non-advancing cursor; stopping pagination early. This matches a known GitHub GraphQL API pagination bug (github/community#30687).`
				);
			}
			break;
		}
		after = nextCursor;
	}

	return { nodes: [...collected.values()], totalCount };
};

export function estimateAudienceCost(
	followersCount: number,
	followingCount: number,
	rateLimit: RateLimit
): CostEstimate {
	const followerPages = Math.ceil(followersCount / GITHUB_MAX_PAGE_SIZE);
	const followingPages = Math.ceil(followingCount / GITHUB_MAX_PAGE_SIZE);
	const pointsNeeded = Math.max(followerPages + followingPages, 1);

	return {
		pointsNeeded,
		remaining: rateLimit.remaining,
		willExceed: pointsNeeded > rateLimit.remaining - quotaBuffer(rateLimit)
	};
}

function classifyGraphqlRateLimitError(error: unknown): Date | null {
	const status = (error as { status?: number } | null)?.status;
	if (status === 403 || status === 429) {
		const headers = (error as { response?: { headers?: Record<string, string> } })
			?.response?.headers;
		return resetAtFromHeaders(headers);
	}
	if (error instanceof GraphqlResponseError) {
		if (error.errors?.some((e) => e.type === "RATE_LIMITED"))
			return new Date(Date.now() + 60_000);
	}
	return null;
}

function toRateLimitSnapshot(rateLimit: RateLimit) {
	return {
		remaining: rateLimit.remaining,
		limit: rateLimit.limit,
		resetAt: new Date(rateLimit.resetAt)
	};
}

export { GITHUB_MAX_PAGE_SIZE };

export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));
