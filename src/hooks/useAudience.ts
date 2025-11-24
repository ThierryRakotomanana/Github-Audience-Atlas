import { useEffect, useState } from "react";
import type { Credentials, GithubProfile, GithubUser } from "../types/api.types";
import {
	fetchAllPages,
	fetchAudiencesProfiles,
	fetchUserProfile
} from "../api/github";

export function useAudience(credentials: Credentials) {
	const [userFollowers, setUserFollowers] = useState<GithubProfile[]>();
	const [userFollowing, setUserFollowing] = useState<GithubProfile[]>();
	const [ghosts, setGhosts] = useState<GithubProfile[]>();
	const [user, setUser] = useState<GithubProfile>();
	const [loading, setLoading] = useState(true);
	const [steps, setSteps] = useState<{ steps: number; done: boolean }>();
	const handleSteps = (steps: number, done: boolean) => {
		setSteps({ steps, done });
	};

	useEffect(() => {
		if (!credentials.user) return;
		async function fetchAudience() {
			setLoading(true);
			const user = await fetchUserProfile(credentials);
			const [followers, following] = await Promise.all([
				fetchAllPages(credentials, "followers", handleSteps),
				fetchAllPages(credentials, "following", handleSteps)
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
		fetchAudience();
	}, [credentials]);

	return { userFollowers, userFollowing, ghosts, user, loading, steps };
}
