import { z } from "zod"
import { GitHubUserSchema, userLocationSchema, type GithubLocation, type GitHubUser } from "../types/github"
import { GITHUB_CONFIGURATION } from "../config"

export const fetchUserLocation = async(githubUsername : string): Promise<GithubLocation> => {
  const response = await fetch(`${GITHUB_CONFIGURATION.apiBase}/users/${githubUsername}`)
  if (!response.ok) throw new Error('Network error')
  const { location } = await response.json()
  return z.parse(userLocationSchema, location)
  }

export const fetchGithubUserData = async (dataType : string) : Promise<GitHubUser[]> => {
    const response = await fetch(`${GITHUB_CONFIGURATION.apiBase}/users/ThierryRakotomanana/${dataType}`)
    if (!response.ok) throw Error("Newtork problem")
    const rawData = await response.json()
    return z.array(GitHubUserSchema).parse(rawData);
  }