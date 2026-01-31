import { z } from "zod";
import {
	GithubUserSchema,
	type GithubUser,
	type AudienceType,
	type GithubProfile,
	GithubProfileSchema,
	type Credentials,
	type ProfileProgress,
	type RateLimit,
	type CostEstimate
} from "../types/api.types";
import { GITHUB_CONFIG } from "../config";

export class GithubApiError extends Error {
	constructor(
		message: string,
		public readonly status: number
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

export function parseRateLimit(headers: Headers): RateLimit {
	return {
		limit: parseInt(headers.get("X-RateLimit-Limit") ?? "60"),
		remaining: parseInt(headers.get("X-RateLimit-Remaining") ?? "0"),
		resetAt: new Date(parseInt(headers.get("X-RateLimit-Reset") ?? "0") * 1000)
	};
}

const QUOTA_BUFFER = 50;

export function isQuotaLow(rateLimit: RateLimit): boolean {
	return rateLimit.remaining <= QUOTA_BUFFER;
}

export const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const fetchUserProfile = async ({
	user,
	signal,
	token
}: Credentials & { signal: AbortSignal }): Promise<{
	data: GithubProfile;
	rateLimit: RateLimit;
}> => {
	const endPoint = `users/${user}`;
	const { data, rateLimit } = await githubFetch(endPoint, signal, token);
	if (isQuotaLow(rateLimit)) {
		throw new RateLimitError(rateLimit.resetAt);
	}
	return {
		data: parseOrThrow(GithubProfileSchema, data, `Profile : ${user}`),
		rateLimit
	};
};

export const githubFetch = async (
	endPoint: string,
	signal: AbortSignal,
	token?: string,
	params?: Record<string, number | string>
): Promise<{ data: unknown; rateLimit: RateLimit }> => {
	const url = new URL(`${GITHUB_CONFIG.apiBase}/${endPoint}`);
	if (params)
		Object.entries(params).forEach(([k, v]) =>
			url.searchParams.set(k, v.toString())
		);
	const headers: HeadersInit = {
		Accept: "application/vnd.github+json",
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};

	const response = await fetch(url, { headers, signal: signal });

	const rateLimit = parseRateLimit(response.headers);

	if (response.status === 403 || response.status === 429) {
		throw new RateLimitError(rateLimit.resetAt);
	}
	if (response.status === 403)
		throw new GithubApiError(
			"GitHub API rate limit exceeded. Add a token to raise it to 5000 req/hr.",
			403
		);
	if (response.status === 404) throw new GithubApiError("User not found.", 404);
	if (!response.ok)
		throw new GithubApiError(
			`GitHub API error: ${response.status} ${response.statusText}`,
			response.status
		);

	const data = await response.json();
	return { data, rateLimit };
};

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, ctx: string): T {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new Error(
			`Schema validation failed ${ctx} : ${result.error.issues.map((i) => i.message).join(", ")}`
		);
	}
	return result.data;
}

export const fetchGithubUserData = async (
	credentials: Credentials,
	audienceType: AudienceType,
	signal: AbortSignal,
	params?: Record<string, number>
): Promise<{ data: GithubUser[]; rateLimit: RateLimit }> => {
	const { user, token } = credentials;
	const endPoint = `users/${user}/${audienceType}`;
	const { data, rateLimit } = await githubFetch(endPoint, signal, token, params);
	return {
		data: parseOrThrow(z.array(GithubUserSchema), data, audienceType),
		rateLimit
	};
};

export const fetchAllPages = async (
	credentials: Credentials,
	audienceType: AudienceType,
	signal: AbortSignal,
	onProgress?: (step: number) => void
): Promise<GithubUser[]> => {
	let page = 1;
	const allAudiences: GithubUser[] = [];
	while (true) {
		const { data: audienceByPage, rateLimit } = await fetchGithubUserData(
			credentials,
			audienceType,
			signal,
			{
				per_page: 100,
				page
			}
		);

		if (isQuotaLow(rateLimit)) {
			throw new RateLimitError(rateLimit.resetAt);
		}
		allAudiences.push(...audienceByPage);
		onProgress?.(allAudiences.length);
		await delay(100);
		if (audienceByPage.length < 100) break;
		page++;
	}
	return allAudiences;
};

export const fetchBySteps = async (
	audiences: string[],
	tasks: (() => Promise<{
		data: GithubProfile;
		rateLimit: RateLimit;
	}>)[],
	concurrency: number,
	onProgress: ({ done, total }: { done: number; total: number }) => void
): Promise<GithubProfile[]> => {
	let index: number = 0;
	const results: GithubProfile[] = new Array(tasks.length);
	const worker = async () => {
		while (index < audiences.length) {
			const current = index++;
			const { data } = await tasks[current]();
			results[current] = data;
			onProgress({ done: index, total: audiences.length });
		}
		return results;
	};
	await Promise.all(
		Array.from({ length: Math.min(audiences.length, concurrency) }, worker)
	);
	return results;
};

export const fetchAudiencesProfiles = async (
	logins: string[],
	token: string,
	signal: AbortSignal,
	onProgress: (progress: ProfileProgress) => void
): Promise<Map<string, GithubProfile>> => {
	const tasks = logins.map((login) => {
		return async () => await fetchUserProfile({ user: login, token, signal });
	});

	const profiles = await fetchBySteps(logins, tasks, 20, ({ done, total }) => {
		onProgress?.({ done, total });
	});
	const audienceProfiles = new Map<string, GithubProfile>();
	profiles.map((profile) => audienceProfiles.set(profile.login, profile));
	return audienceProfiles;
};

export function estimateCost(
	followers: number,
	following: number,
	rateLimit: RateLimit
): CostEstimate {
	const followerPages = Math.ceil(followers / 100);
	const followingPages = Math.ceil(following / 100);
	const profileRequests = followers + following;
	const requestsNeeded = followerPages + followingPages + profileRequests;

	return {
		requestsNeeded,
		remaining: rateLimit.remaining,
		willExceed: requestsNeeded > rateLimit.remaining - 50
	};
}
