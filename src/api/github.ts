import { z } from "zod";
import {
	GithubUserSchema,
	type GithubUser,
	type AudienceType,
	type GithubProfile,
	GithubProfileSchema,
	type Credentials
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

export const fetchUserProfile = async ({
	user,
	token
}: Credentials): Promise<GithubProfile> => {
	const endPoint = `users/${user}`;
	const response = await githubFetch(endPoint, token);
	const data = await response.json();
	return parseOrThrow(GithubProfileSchema, data, `Profile : ${user}`);
};

export const githubFetch = async (
	endPoint: string,
	token?: string,
	params?: Record<string, number | string>
): Promise<Response> => {
	const url = new URL(`${GITHUB_CONFIG.apiBase}/${endPoint}`);
	if (params)
		Object.entries(params).forEach(([k, v]) =>
			url.searchParams.set(k, v.toString())
		);
	const headers: HeadersInit = {
		Accept: "application/vnd.github+json",
		...(token ? { Authorization: `Bearer ${token}` } : {})
	};

	const response = await fetch(url, { headers });

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

	return response;
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
	params?: Record<string, number>
): Promise<GithubUser[]> => {
	const { user, token } = credentials;
	const endPoint = `users/${user}/${audienceType}`;
	const response = await githubFetch(endPoint, token, params);
	const rawData = await response.json();
	return parseOrThrow(z.array(GithubUserSchema), rawData, audienceType);
};

export const fetchAllPages = async (
	credentials: Credentials,
	audienceType: AudienceType,
	onProgress?: (step: number) => void
): Promise<GithubUser[]> => {
	let page = 1;
	const allAudiences: GithubUser[] = [];
	while (true) {
		const audienceByPage = await fetchGithubUserData(credentials, audienceType, {
			per_page: 100,
			page
		});
		allAudiences.push(...audienceByPage);
		onProgress?.(allAudiences.length);
		await new Promise((param) => setTimeout(param, 120));
		if (audienceByPage.length < 100) break;
		page++;
	}
	return allAudiences;
};

export const fetchBySteps = async (
	audiences: string[],
	tasks: (() => Promise<GithubProfile>)[],
	concurrency: number,
	updateSteps: (steps: number, done: boolean) => void
): Promise<GithubProfile[]> => {
	let index: number = 0;
	const results: GithubProfile[] = [];
	const worker = async () => {
		while (index < audiences.length) {
			results.push(await tasks[index]());
			index++;
			updateSteps(index, false);
		}
		return results;
	};
	await Promise.all(
		Array.from({ length: Math.min(audiences.length, concurrency) }, worker)
	);
	updateSteps(results.length, true);
	return results;
};

export const fetchAudiencesProfiles = async (
	logins: string[],
	token: string,
	updateSteps: (steps: number, done: boolean) => void
): Promise<Map<string, GithubProfile>> => {
	const tasks = logins.map((login) => {
		return async () => await fetchUserProfile({ user: login, token });
	});

	const profiles = await fetchBySteps(logins, tasks, 100, updateSteps);
	const audienceProfiles = new Map<string, GithubProfile>();
	profiles.map((profile) => audienceProfiles.set(profile.login, profile));
	return audienceProfiles;
};
