import { useEffect, useState } from 'react';
import './App.css';
import { type GithubProfile } from './types/api.types';
import {
  fetchAllPages,
  fetchAudiencesProfiles,
  fetchUserProfile,
} from './api/github';
import { GithubExplorer } from './components/GithubExplorer';
import Credentials from './components/Credentials';

export type Crendentials = { user: string; token: string };

function App() {
  const [userFollowers, setUserFollowers] = useState<GithubProfile[]>();
  const [userFollowing, setUserFollowing] = useState<GithubProfile[]>();
  const [ghosts, setGhosts] = useState<GithubProfile[]>();
  const [user, setUser] = useState<GithubProfile>();
  const [credentials, setCredential] = useState<Crendentials>({
    user: '',
    token: '',
  });
  const handleCredentials = (credentials: Crendentials) => {
    setCredential({ ...credentials });
  };
  const [loading, setLoading] = useState<Boolean>(true);

  //TO DO
  // a custom hook should handle this, and errors(offline, ratelimit etc)
  useEffect(() => {
    setLoading(true);
    if (!credentials.user) return;
    async function fechAudience() {
      const [followers, following, user] = await Promise.all([
        await fetchAllPages(credentials.user, 'followers', credentials.token),
        await fetchAllPages(credentials.user, 'following', credentials.token),
        await fetchUserProfile(credentials.user),
      ]);

      setUser(user);
      const followerProfiles = await fetchAudiencesProfiles(followers);
      const followingProfiles = await fetchAudiencesProfiles(following);

      setUserFollowers(followerProfiles);
      setUserFollowing(followingProfiles);

      const isGhost = new Set<number>(followers.map((follower) => follower.id));
      setGhosts(() =>
        followingProfiles.filter((following) => !isGhost.has(following.id)),
      );
      setLoading(false);
    }
    fechAudience();
  }, [credentials]);

  return (
    <>
      <div>
        {/**
         * TODO
         * need to refactor this
         **/}
        <Credentials handleCredentials={handleCredentials} />
        {loading
          ? `We are still waiting`
          : user &&
            ` Here you are  :  ${user.name} You have ${user.followers} followers and ${user.following} following`}
        {!loading && userFollowers && userFollowing && ghosts && (
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
