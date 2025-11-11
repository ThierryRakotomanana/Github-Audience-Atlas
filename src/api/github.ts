import { z } from "zod"
import { GithubUserSchema, LocationSchema, type GithubLocation, type GithubUser, type GithubProfile } from "../types/api.types"
import { GITHUB_CONFIGURATION } from "../config"

export const fetchUserLocation = async(githubUsername : string): Promise<GithubLocation> => {
  const response = await fetch(`${GITHUB_CONFIGURATION.apiBase}/users/${githubUsername}`)
  if (!response.ok) throw new Error('Network error')
  const { location } = await response.json()
  return z.parse(LocationSchema, location)
}

export const fetchGithubUserData = async (dataType : string) : Promise<GithubUser[]> => {
    const response = await fetch(`${GITHUB_CONFIGURATION.apiBase}/users/ThierryRakotomanana/${dataType}`)
    if (!response.ok) throw Error("Newtork problem")
    const rawData = await response.json()
    return z.array(GithubUserSchema).parse(rawData);
}