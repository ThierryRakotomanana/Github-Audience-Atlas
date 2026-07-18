import { graphql as githubGraphql, GraphqlResponseError } from "@octokit/graphql";
import type {
	AudienceType,
	AudiencePageResult,
	GithubProfileNode,
	RateLimit,
	RawAudienceQueryResponse,
	RawUserProfileQueryResponse,
	UserProfileResult
} from "./graphql.types";

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
	constructor(public resetAt: Date) {
		super(`Rate limit exceeded. Resets at ${resetAt.toLocaleTimeString()}.`);
		this.name = "RateLimitError";
	}
}

const QUOTA_BUFFER_RATIO = 0.02;

function quotaBuffer(rateLimit: RateLimit): number {
	return Math.max(Math.ceil(rateLimit.limit * QUOTA_BUFFER_RATIO), 1);
}

export function isQuotaLow(rateLimit: RateLimit): boolean {
	return rateLimit.remaining <= quotaBuffer(rateLimit);
}

const PROFILE_FIELDS = `
	login
	id
	name
	avatarUrl
	url
	company
	location
	twitterUsername
	isSiteAdmin
`;

const RATE_LIMIT_FIELDS = `
	rateLimit {
		limit
		cost
		remaining
		resetAt
	}
`;

function buildAudienceQuery(audienceType: AudienceType): string {
	return `
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
						${PROFILE_FIELDS}
					}
				}
			}
			${RATE_LIMIT_FIELDS}
		}
	`;
}

const USER_PROFILE_QUERY = `
	query UserProfile($login: String!) {
		user(login: $login) {
			${PROFILE_FIELDS}
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
	token: string,
	signal?: AbortSignal
): Promise<UserProfileResult> => {
	const client = createClient(token, signal);

	let result: RawUserProfileQueryResponse;
	try {
		result = await client<RawUserProfileQueryResponse>(USER_PROFILE_QUERY, {
			login
		});
	} catch (error) {
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
	token: string,
	options: { first?: number; after?: string | null; signal?: AbortSignal } = {}
): Promise<AudiencePageResult> => {
	const { first = 100, after = null, signal } = options;
	const client = createClient(token, signal);
	const query = buildAudienceQuery(audienceType);

	let result: RawAudienceQueryResponse;
	try {
		result = await client<RawAudienceQueryResponse>(query, { login, first, after });
	} catch (error) {
		throw toGithubApiError(error, login);
	}

	const audience = result.user?.[audienceType];
	if (!result.user || !audience)
		throw new GithubApiError(`User not found: ${login}`, 404);

	return { login: result.user.login, audience, rateLimit: result.rateLimit };
};

export const fetchAllAudience = async (
	login: string,
	audienceType: AudienceType,
	token: string,
	onProgress?: (done: number, total: number) => void,
	signal?: AbortSignal
): Promise<GithubProfileNode[]> => {
	const all: GithubProfileNode[] = [];
	let after: string | null = null;
	let hasNextPage = true;

	while (hasNextPage) {
		const { audience, rateLimit } = await fetchAudiencePage(
			login,
			audienceType,
			token,
			{
				after,
				signal
			}
		);
		if (isQuotaLow(rateLimit))
			throw new RateLimitError(new Date(rateLimit.resetAt));

		all.push(...audience.nodes);
		onProgress?.(all.length, audience.totalCount);

		hasNextPage = audience.pageInfo.hasNextPage;
		after = audience.pageInfo.endCursor;
	}

	return all;
};

export function estimateAudienceCost(
	followersCount: number,
	followingCount: number,
	rateLimit: RateLimit
): CostEstimate {
	const followerPages = Math.ceil(followersCount / 100);
	const followingPages = Math.ceil(followingCount / 100);
	const pointsNeeded = Math.max(followerPages + followingPages, 1);

	return {
		pointsNeeded,
		remaining: rateLimit.remaining,
		willExceed: pointsNeeded > rateLimit.remaining - quotaBuffer(rateLimit)
	};
}

export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));
