import { useEffect, useState } from 'react'
import './App.css'
import { type GithubUser } from './types/api.types'
import { fetchAllPages } from './api/github'
import { GithubExplorer } from './components/GithubExplorer'

function App() {
  const [userFollowers, setUserFollowers] = useState<GithubUser[]>()
  const [userFollowing, setUserFollowing] = useState<GithubUser[]>()
  const [ghosts, setGhosts] = useState<GithubUser[]>()

  useEffect(() => {
    async function fechAudience() {
      const [followers, following] = await Promise.all([
        await fetchAllPages('followers'),
        await fetchAllPages('following')
      ])
      setUserFollowers(followers)
      setUserFollowing(following)
      
      const isGhost = new Map<number, GithubUser>()

      followers.map((follower)=> {
        isGhost.set(follower.id, follower)
      })

      setGhosts(() => {
        const ghosts = following.filter((following)=> {
          if (!isGhost.has(following.id)) return following
        })
        return ghosts
      })
    }
    fechAudience()
  },[])

  return (
    <>
    <div> { userFollowers && userFollowing && ghosts && <GithubExplorer followers={userFollowers} following={userFollowing} ghosts={ghosts}/>}
    </div>
    </>
  )
}

export default App
