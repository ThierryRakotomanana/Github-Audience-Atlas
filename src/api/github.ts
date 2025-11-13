import { z } from "zod"
import { GithubUserSchema, LocationSchema, type GithubLocation, type GithubUser, type GithubProfile } from "../types/api.types"
import { GITHUB_CONFIGURATION } from "../config"

export const fetchUserLocation = async(githubUsername : string): Promise<GithubLocation> => {
  const response = await fetch(`${GITHUB_CONFIGURATION.apiBase}/users/${githubUsername}`)
  if (!response.ok) throw new Error('Network error')
  const { location } = await response.json()
  return z.parse(LocationSchema, location)
}

export const fetchGithubUserData = async (RequestType : 'followers'|'following', page : number) : Promise<GithubUser[]> => {
    const response = await fetch(`${GITHUB_CONFIGURATION.apiBase}/users/ThierryRakotomanana/${RequestType}?per_page=100&page=${page}`)
    if (!response.ok) throw Error("Newtork problem")
    const rawData = await response.json()
    return z.array(GithubUserSchema).parse(rawData);
}

export const fetchAllPages = async(RequestType : 'followers'|'following') : Promise<GithubUser[]> => {
  let calling = true
  let page = 1, Users : GithubUser[] = []
  while(calling) {
    const audience = await fetchGithubUserData(RequestType, page)
    Users = [...Users, ...audience]
    if(audience.length == 0 ){ 
      calling = false
    }
    console.log(page)
    page++
  }
  console.dir(Users)
  return Users
} 