import { useEffect, useState } from "react";
import "./App.css";
import { type GithubProfile } from "./types/api.types";
import {
	fetchAllPages,
	fetchAudiencesProfiles,
	fetchUserProfile
} from "./api/github";
import { GithubExplorer } from "./components/GithubExplorer";
import type { Credentials } from "./types/api.types";
import CredentialForm from "./components/Credentials";

function App() {
	const [userFollowers, setUserFollowers] = useState<GithubProfile[]>();
	const [userFollowing, setUserFollowing] = useState<GithubProfile[]>();
	const [ghosts, setGhosts] = useState<GithubProfile[]>();
	const [user, setUser] = useState<GithubProfile>();
	const [credentials, setCredential] = useState<Credentials>({
		user: "",
		token: ""
	});
	const handleCredentials = (credentials: Credentials) => {
		setCredential({ ...credentials });
	};
	const [loading, setLoading] = useState<boolean>(true);

	//TO DO
	// a custom hook should handle this, and errors(offline, ratelimit etc)
	useEffect(() => {
		if (!credentials.user) return;
		async function fechAudience() {
			setLoading(true);
			const [followers, following, user] = await Promise.all([
				await fetchAllPages(credentials, "followers"),
				await fetchAllPages(credentials, "following"),
				await fetchUserProfile(credentials.user)
			]);

			setUser(user);
			const followerProfiles = await fetchAudiencesProfiles(followers);
			const followingProfiles = await fetchAudiencesProfiles(following);

			setUserFollowers(followerProfiles);
			setUserFollowing(followingProfiles);

			const isGhost = new Set<number>(followers.map((follower) => follower.id));
			setGhosts(() =>
				followingProfiles.filter((following) => !isGhost.has(following.id))
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
				<CredentialForm handleCredentials={handleCredentials} />
				{loading ?
					`We are still waiting`
				:	user
					&& ` Here you are  :  ${user.name} You have ${user.followers} followers and ${user.following} following`
				}
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
