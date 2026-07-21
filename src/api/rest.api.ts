import { request as octokitRequest } from "@octokit/request";
import { GithubApiError, GITHUB_MAX_PAGE_SIZE } from "./graphql.api";
import {
	AllTokensExhaustedError,
	resetAtFromHeaders,
	TokenPool,
	withTokenRotation
} from "./token-pool";
import type { AudienceType, GithubProfileNode } from "./graphql.types";

type GithubProfileRest = {
	login: string;
	node_id: string;
	name: string | null;
	avatar_url: string;
	html_url: string;
	company: string | null;
	location: string | null;
	twitter_username?: string | null;
	site_admin: boolean;
};

function createRestClient(token: string, signal?: AbortSignal) {
	return octokitRequest.defaults({
		headers: { authorization: `token ${token}` },
		request: { signal }
	});
}

function toRestApiError(error: unknown, login: string): Error {
	if (error && typeof error === "object" && "status" in error) {
		const status = (error as { status?: number }).status;
		if (status === 404) return new GithubApiError(`User not found: ${login}`, 404);
		if (status === 401)
			return new GithubApiError("Invalid or expired GitHub token.", 401);
		if (status === 403)
			return new GithubApiError("GitHub REST API rate limit exceeded.", 403);
		return new GithubApiError(`GitHub REST API error: ${status}`, status);
	}
	return error instanceof Error ? error : (
			new GithubApiError("Unknown GitHub REST API error.")
		);
}

function classifyRestRateLimitError(error: unknown): Date | null {
	const status = (error as { status?: number } | null)?.status;
	if (status !== 403 && status !== 429) return null;
	const headers = (error as { response?: { headers?: Record<string, string> } })
		?.response?.headers;
	return resetAtFromHeaders(headers);
}

function reportRestUsage(
	pool: TokenPool,
	token: string,
	headers: Record<string, unknown>
): void {
	const remaining = Number(headers["x-ratelimit-remaining"]);
	const limit = Number(headers["x-ratelimit-limit"]);
	const reset = Number(headers["x-ratelimit-reset"]);
	if (
		Number.isFinite(remaining)
		&& Number.isFinite(limit)
		&& Number.isFinite(reset)
	) {
		pool.report(token, { remaining, limit, resetAt: new Date(reset * 1000) });
	}
}

const AUDIENCE_ROUTES = {
	followers: "GET /users/{username}/followers",
	following: "GET /users/{username}/following"
} as const;

async function fetchAudiencePageRest(
	login: string,
	audienceType: AudienceType,
	pool: TokenPool,
	page: number,
	signal?: AbortSignal
) {
	let response;
	try {
		response = await withTokenRotation(
			pool,
			async (token) => {
				const client = createRestClient(token, signal);
				const res = await client(AUDIENCE_ROUTES[audienceType], {
					username: login,
					per_page: GITHUB_MAX_PAGE_SIZE,
					page
				});
				reportRestUsage(pool, token, res.headers as Record<string, unknown>);
				return res;
			},
			classifyRestRateLimitError
		);
	} catch (error) {
		if (error instanceof AllTokensExhaustedError) throw error;
		throw toRestApiError(error, login);
	}

	const linkHeader = response.headers.link;
	return {
		logins: response.data.map((user: { login: string }) => user.login),
		hasNextPage: typeof linkHeader === "string" && linkHeader.includes('rel="next"')
	};
}

export const fetchAllAudienceLoginsRest = async (
	login: string,
	audienceType: AudienceType,
	pool: TokenPool,
	onProgress?: (done: number) => void,
	signal?: AbortSignal
): Promise<Set<string>> => {
	const logins = new Set<string>();
	let page = 1;
	let hasNextPage = true;

	while (hasNextPage) {
		const result = await fetchAudiencePageRest(
			login,
			audienceType,
			pool,
			page,
			signal
		);
		for (const l of result.logins) logins.add(l);
		onProgress?.(logins.size);
		hasNextPage = result.hasNextPage;
		page += 1;
	}

	return logins;
};

function mapRestUserToProfileNode(user: GithubProfileRest): GithubProfileNode {
	return {
		login: user.login,
		id: user.node_id,
		name: user.name,
		avatarUrl: user.avatar_url,
		url: user.html_url,
		company: user.company,
		location: user.location,
		twitterUsername: user.twitter_username ?? null,
		isSiteAdmin: user.site_admin
	} as GithubProfileNode;
}

export const fetchUserProfileRest = async (
	login: string,
	pool: TokenPool,
	signal?: AbortSignal
): Promise<GithubProfileNode | null> => {
	try {
		return await withTokenRotation(
			pool,
			async (token) => {
				const client = createRestClient(token, signal);
				const response = await client("GET /users/{username}", { username: login });
				reportRestUsage(pool, token, response.headers as Record<string, unknown>);
				return mapRestUserToProfileNode(response.data as GithubProfileRest);
			},
			classifyRestRateLimitError
		);
	} catch (error) {
		if (error instanceof AllTokensExhaustedError) throw error;
		if (
			error
			&& typeof error === "object"
			&& (error as { status?: number }).status === 404
		) {
			return null;
		}
		throw toRestApiError(error, login);
	}
};

export interface BatchProfilesResult {
	profiles: Map<string, GithubProfileNode>;
	unresolved: string[];
}

async function mapWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	fn: (item: T) => Promise<R>
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let next = 0;

	async function worker() {
		while (next < items.length) {
			const i = next++;
			results[i] = await fn(items[i]);
		}
	}

	await Promise.all(
		Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, worker)
	);
	return results;
}

export const BACKFILL_CONCURRENCY = 20;

export const fetchProfilesByLoginRest = async (
	logins: string[],
	pool: TokenPool,
	signal?: AbortSignal,
	concurrency = BACKFILL_CONCURRENCY
): Promise<BatchProfilesResult> => {
	const profiles = new Map<string, GithubProfileNode>();
	const unresolved: string[] = [];

	await mapWithConcurrency(logins, concurrency, async (login) => {
		try {
			const node = await fetchUserProfileRest(login, pool, signal);
			if (node) profiles.set(login, node);
			else unresolved.push(login);
		} catch (error) {
			if (error instanceof AllTokensExhaustedError) throw error;

			if (error instanceof Error && error.name === "AbortError") {
				throw error;
			}

			unresolved.push(login);
		}
	});

	return { profiles, unresolved };
};
