import { z } from 'zod';
import {
  GithubUserSchema,
  type GithubUser,
  type AudienceType,
  type GithubProfile,
  GithubProfileSchema,
} from '../types/api.types';
import { GITHUB_CONFIG } from '../config';

export class GithubApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'GithubApiError';
  }
}

export const fetchUserProfile = async (
  githubUser: string,
): Promise<GithubProfile> => {
  const endPoint = `users/${githubUser}`;
  const response = await githubFetch(endPoint);
  const data = await response.json();
  return parseOrThrow(GithubProfileSchema, data);
};

export const githubFetch = async (
  endPoint: string,
  token: string = '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',
  params?: Record<string, number | string>,
): Promise<Response> => {
  const url = new URL(`${GITHUB_CONFIG.apiBase}/${endPoint}`);
  if (params)
    Object.entries(params).forEach(([k, v]) =>
      url.searchParams.set(k, v.toString()),
    );
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { headers });

  if (response.status === 403)
    throw new GithubApiError(
      'GitHub API rate limit exceeded. Add a token to raise it to 5000 req/hr.',
      403,
    );
  if (response.status === 404) throw new GithubApiError('User not found.', 404);
  if (!response.ok)
    throw new GithubApiError(
      `GitHub API error: ${response.status} ${response.statusText}`,
      response.status,
    );

  return response;
};

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Schema validation failed: ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return result.data;
}

export const fetchGithubUserData = async (
  endPoint: string,
  token?: string,
  params?: Record<string, number>,
): Promise<GithubUser[]> => {
  const response = await githubFetch(endPoint, token, params);
  const rawData = await response.json();
  return parseOrThrow(z.array(GithubUserSchema), rawData);
};

export const fetchAllPages = async (
  githubUser: string,
  audienceType: AudienceType,
  token: string,
): Promise<GithubUser[]> => {
  const path = `users/${githubUser}/${audienceType}`;
  let page = 1,
    allAudiences: GithubUser[] = [];
  while (true) {
    const audienceByPage = await fetchGithubUserData(path, token, {
      per_page: 100,
      page,
    });
    allAudiences.push(...audienceByPage);
    if (audienceByPage.length < 100) break;
    page++;
  }
  return allAudiences;
};
