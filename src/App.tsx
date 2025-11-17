import { useEffect, useState } from 'react';
import './App.css';
import { type GithubProfile } from './types/api.types';
import { fetchAllPages, fetchUserProfile } from './api/github';
import { GithubExplorer } from './components/GithubExplorer';

function App() {
  const [userFollowers, setUserFollowers] = useState<GithubProfile[]>();
  const [userFollowing, setUserFollowing] = useState<GithubProfile[]>();
  const [ghosts, setGhosts] = useState<GithubProfile[]>();
  const [user, setUser] = useState<GithubProfile>();
  const userName = `ThierryRakotomanana`;
  useEffect(() => {
    async function fechAudience() {
      const [followers, following, user] = await Promise.all([
        await fetchAllPages(userName, 'followers'),
        await fetchAllPages(userName, 'following'),
        await fetchUserProfile(userName),
      ]);
      setUser(user);

      const followerProfiles = await Promise.all(
        followers.map(async (follower) => {
          return await fetchUserProfile(follower.login);
        }),
      );

      const followingProfiles = await Promise.all(
        following.map(async (following) => {
          return await fetchUserProfile(following.login);
        }),
      );

      setUserFollowers(followerProfiles);
      setUserFollowing(followingProfiles);

      //need to make followers to Profile

      const isGhost = new Set<number>(followers.map((follower) => follower.id));
      setGhosts(() =>
        followingProfiles.filter((following) => !isGhost.has(following.id)),
      );
    }
    fechAudience();
  }, []);

  return (
    <>
      <div>
        {user &&
          ` Here you are  :  ${user.name} You have ${user.followers} followers and ${user.following} following`}
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
