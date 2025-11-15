import type { GithubUser } from '../types/api.types';

type AudienceProps = {
  followers: GithubUser[];
  following: GithubUser[];
  ghosts: GithubUser[];
};

export const GithubExplorer = (audience: AudienceProps) => {
  return (
    <div style={{ display: `flex` }}>
      <section>
        <div> Followers {audience.followers.length} </div>
        {audience.followers.map((follower) => {
          return (
            <div>
              <img style={{ width: `40px` }} src={follower.avatar_url} alt="" />
              <a href={follower.url}> {follower.login} </a>
            </div>
          );
        })}
      </section>
      <section>
        <div> Following {audience.following.length} </div>
        {audience.following.map((following) => {
          return (
            <div>
              <img
                style={{ width: `40px` }}
                src={following.avatar_url}
                alt=""
              />
              <a href={following.url}> {following.login} </a>
            </div>
          );
        })}
      </section>
      <section>
        <div> Ghosts {audience.ghosts.length} </div>
        {audience.ghosts &&
          audience.ghosts.map((ghost) => {
            return (
              <div>
                <img style={{ width: `40px` }} src={ghost.avatar_url} alt="" />
                <a href={ghost.url}> {ghost.login} </a>
              </div>
            );
          })}
      </section>
    </div>
  );
};
