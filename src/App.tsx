import { useState } from 'react'
import * as z from 'zod'
import './App.css'
import { GitHubUserSchema, userLocationSchema, type GitHubUser, type GithubLocation } from './types/github'

function App() {
  const [location, setLocation] = useState<GithubLocation>()
  
  const getUserLocation = async(githubUsername : string) => {
  const response = await fetchUserLocation(githubUsername)
  setLocation(response)
  }

  const fetchUserLocation = async(githubUsername : string): Promise<GithubLocation> => {
  const response = await fetch(`https://api.github.com/users/${githubUsername}`)
  if (!response.ok) throw new Error('Network error')
  const { location } = await response.json()
  return z.parse(userLocationSchema, location)
  }

  const [userFollowers, setUserFollowers] = useState<GitHubUser[]>()
  const [userFollowing, setUserFollowing] = useState<GitHubUser[]>()

  const fetchGithubUserData = async (dataType : string) : Promise<GitHubUser[]> => {
    const response = await fetch(`https://api.github.com/users/ThierryRakotomanana/${dataType}`)
    if (!response.ok) throw Error("Newtork problem")
    const rawData = await response.json()
    return z.array(GitHubUserSchema).parse(rawData);

  }

  const getUserData = async (call : string) => {
    const result = await fetchGithubUserData(call)
    call == `followers` ? setUserFollowers(result) : setUserFollowing(result)
    
  }
  return (
    <>
    <button onClick={()=> getUserLocation(`ThierryRakotomanana`)}>Get Location</button>
    <div> {location} </div>
    <button onClick={ () => getUserData(`followers`)}>Get follower's names</button>
    <div>{userFollowers && userFollowers.map((followers)=> <div>{followers.login}</div>)}</div>
    <button onClick={ () => getUserData(`following`)}>get following's name</button>
    <div>{userFollowing && userFollowing.map((following)=> <div>{following.login}</div>)}</div>
    </>
  )
}

export default App
