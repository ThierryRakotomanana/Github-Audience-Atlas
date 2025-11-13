import { useState } from 'react'
import './App.css'
import { type GithubUser, type GithubLocation } from './types/api.types'
import { fetchAllPages, fetchUserLocation } from './api/github'

function App() {
  const [location, setLocation] = useState<GithubLocation>()
  const [userFollowers, setUserFollowers] = useState<GithubUser[]>()
  const [userFollowing, setUserFollowing] = useState<GithubUser[]>()

  const getUserData = async (call : 'followers'|'following') => {
    const result = await fetchAllPages(call)
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
