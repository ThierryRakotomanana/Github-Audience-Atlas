import { useState } from 'react'
import './App.css'
import { type GitHubUser, type GithubLocation } from './types/github'
import { fetchGithubUserData, fetchUserLocation } from './api/github'

function App() {
  const [location, setLocation] = useState<GithubLocation>()
  const [userFollowers, setUserFollowers] = useState<GitHubUser[]>()
  const [userFollowing, setUserFollowing] = useState<GitHubUser[]>()

  const getUserData = async (call : string) => {
    const result = await fetchGithubUserData(call)
    call == `followers` ? setUserFollowers(result) : setUserFollowing(result)
    
  }
  
  const getUserLocation = async(githubUsername : string) => {
  const response = await fetchUserLocation(githubUsername)
  setLocation(response)
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
