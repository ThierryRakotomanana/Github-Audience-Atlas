import { useState } from 'react'
import * as z from 'zod'
import './App.css'

const userLocationSchema = z.string()

export const GitHubUserSchema = z.object({
  login:               z.string(),
  id:                  z.number(),
  node_id:             z.string(),
  avatar_url:          z.url(),
  gravatar_id:         z.string(),
  url:                 z.url(),
  html_url:            z.url(),
  followers_url:       z.url(),
  following_url:       z.url(),
  gists_url:           z.url(),
  starred_url:         z.url(),
  subscriptions_url:   z.url(),
  organizations_url:   z.url(),
  repos_url:           z.url(),
  events_url:          z.url(),
  received_events_url: z.url(),
  type:                z.enum(['User', 'Organization', 'Bot']),
  user_view_type:      z.string(),
  site_admin:          z.boolean(),
});

function App() {
  const [location, setLocation] = useState<z.infer<typeof userLocationSchema>>()

  const getUserLocation = async(githubUsername : string): Promise<string> => {
  const response = await fetch(`https://api.github.com/users/${githubUsername}`)
  if (!response.ok) throw new Error('Network error')
  const { location } = await response.json()
  const raw = z.parse(userLocationSchema, location)
  setLocation(raw)
  return raw
  }

  const [userFollowers, setUserFollowers] = useState<z.infer< typeof GitHubUserSchema>[]>()
  const [userFollowing, setUserFollowing] = useState<z.infer< typeof GitHubUserSchema>[]>()

  const fetchGithubUserData = async (dataType : string) : Promise<z.infer< typeof GitHubUserSchema>[]> => {
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
