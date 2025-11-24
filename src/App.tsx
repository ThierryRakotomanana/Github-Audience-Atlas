import { useEffect, useState } from "react";
import "./App.css";
import { type GithubProfile } from "./types/api.types";
import {
	fetchAllPages,
	fetchAudiencesProfiles,
	fetchUserProfile
} from "./api/github";
import { GithubExplorer } from "./components/GithubExplorer";
import type { Credentials, GithubUser } from "./types/api.types";
import CredentialForm from "./components/CredentialForm";

function App() {
	const [userFollowers, setUserFollowers] = useState<GithubProfile[]>();
	const [userFollowing, setUserFollowing] = useState<GithubProfile[]>();
	const [ghosts, setGhosts] = useState<GithubProfile[]>();
	const [user, setUser] = useState<GithubProfile>();
	const [credentials, setCredential] = useState<Credentials>({
		user: "",
		token: ""
	});
	const [steps, setSteps] = useState<{ steps: number; done: boolean }>();
	const handleSteps = (steps: number, done: boolean) => {
		setSteps({ steps, done });
	};
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
			// We should get the loading phase of each fetch
			/**
			 * Get the followers and following length
			 *
			 */
			const [followers, following, user] = await Promise.all([
				await fetchAllPages(credentials, "followers", handleSteps),
				await fetchAllPages(credentials, "following", handleSteps),
				await fetchUserProfile(credentials)
			]);

			setUser(user);
			const uniqueAudiences = [
				...new Set([...followers, ...following].map((audience) => audience.login))
			];
			const audienceProfiles = await fetchAudiencesProfiles(
				uniqueAudiences,
				credentials.token,
				handleSteps
			);

			const resolve = (rawAudiences: GithubUser[]): GithubProfile[] => {
				return rawAudiences.flatMap((rawAudience) => {
					const profile = audienceProfiles.get(rawAudience.login);
					return profile ? profile : [];
				});
			};

			const followerProfiles = resolve(followers);
			const followingProfiles = resolve(following);

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
					`steps : ${steps?.steps} and status: ${steps?.done}`
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
