import { z } from 'zod';
import {
  GithubUserSchema,
  LocationSchema,
  type GithubLocation,
  type GithubUser,
  type AudienceType,
} from '../types/api.types';
import { GITHUB_CONFIGURATION } from '../config';

export const fetchUserLocation = async (
  githubUsername: string,
): Promise<GithubLocation> => {
  const response = await fetch(
    `${GITHUB_CONFIGURATION.apiBase}/users/${githubUsername}`,
  );
  if (!response.ok) throw new Error('Network error');
  const { location } = await response.json();
  return z.parse(LocationSchema, location);
};

export const fetchGithubUserData = async (
  audienceType: AudienceType,
  page: number,
): Promise<GithubUser[]> => {
  const response = await fetch(
    `${GITHUB_CONFIGURATION.apiBase}/users/ThierryRakotomanana/${audienceType}?per_page=100&page=${page}`,
  );
  if (!response.ok) throw Error('Newtork problem');
  const rawData = await response.json();
  return z.array(GithubUserSchema).parse(rawData);
};

export const fetchAllPages = async (
  audienceType: AudienceType,
): Promise<GithubUser[]> => {
  let page = 1,
    allAudiences: GithubUser[] = [];
  while (true) {
    const audienceByPage = await fetchGithubUserData(audienceType, page);
    allAudiences = [...allAudiences, ...audienceByPage];
    if (audienceByPage.length == 0 || audienceByPage.length < 100) break;
    page++;
  }
  return allAudiences;
};
