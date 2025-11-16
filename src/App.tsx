import { useEffect, useState } from 'react';
import './App.css';
import { type GithubProfile, type GithubUser } from './types/api.types';
import { fetchAllPages, fetchUserProfile } from './api/github';
import { GithubExplorer } from './components/GithubExplorer';

function App() {
  const [userFollowers, setUserFollowers] = useState<GithubUser[]>();
  const [userFollowing, setUserFollowing] = useState<GithubUser[]>();
  const [ghosts, setGhosts] = useState<GithubUser[]>();
  const [user, setUser] = useState<GithubProfile>();
  const userName = `ThierryRakotomanana`;
  useEffect(() => {
    async function fechAudience() {
      const [followers, following, user] = await Promise.all([
        await fetchAllPages(userName, 'followers'),
        await fetchAllPages(userName, 'following'),
        await fetchUserProfile(userName),
      ]);
      setUserFollowers(followers);
      setUserFollowing(following);
      setUser(user);

      const isGhost = new Set<number>(followers.map((follower) => follower.id));
      setGhosts(() =>
        following.filter((following) => !isGhost.has(following.id)),
      );
    }
    fechAudience();
  }, []);

  return (
    <>
      <div>
        {user &&
          ` Here you are  :  ${user?.name} You have ${user?.followers} followers and ${user?.following} following`}
        {userFollowers && userFollowing && ghosts && (
          <GithubExplorer
            followers={userFollowers}
            following={userFollowing}
            ghosts={ghosts}
          />
        )}
      </div>
    </>
  );
}

export default App;
