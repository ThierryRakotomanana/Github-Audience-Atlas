import { z } from 'zod';
import {
  GithubUserSchema,
  type GithubUser,
  type AudienceType,
  type GithubProfile,
  GithubProfileSchema,
  type Credentials,
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
  user: string,
): Promise<GithubProfile> => {
  const endPoint = `/users/${user}`;
  const response = await githubFetch(endPoint);
  const data = await response.json();
  return parseOrThrow(GithubProfileSchema, data, `Profile : ${user}`);
};

export const githubFetch = async (
  endPoint: string,
  token?: string,
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

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, ctx: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Schema validation failed ${ctx} : ${result.error.issues.map((i) => i.message).join(', ')}`,
    );
  }
  return result.data;
}

export const fetchGithubUserData = async (
  credentials: Credentials,
  audienceType: AudienceType,
  params?: Record<string, number>,
): Promise<GithubUser[]> => {
  const { user, token } = credentials;
  const endPoint = `/users/${user}`;
  const response = await githubFetch(endPoint, token, params);
  const rawData = await response.json();
  return parseOrThrow(z.array(GithubUserSchema), rawData, audienceType);
};

export const fetchAllPages = async (
  credentials: Credentials,
  audienceType: AudienceType,
): Promise<GithubUser[]> => {
  let page = 1,
    allAudiences: GithubUser[] = [];
  while (true) {
    const audienceByPage = await fetchGithubUserData(
      credentials,
      audienceType,
      {
        per_page: 100,
        page,
      },
    );
    allAudiences.push(...audienceByPage);
    if (audienceByPage.length < 100) break;
    page++;
  }
  return allAudiences;
};

export const fetchAudiencesProfiles = async (
  audiences: GithubUser[],
): Promise<GithubProfile[]> => {
  return await Promise.all(
    audiences.map(async (audience) => {
      return await fetchUserProfile(audience.login);
    }),
  );
};
