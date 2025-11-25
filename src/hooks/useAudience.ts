import { useEffect, useReducer, useState } from "react";
import type { Credentials, GithubProfile, GithubUser } from "../types/api.types";
import {
	fetchAllPages,
	fetchAudiencesProfiles,
	fetchUserProfile
} from "../api/github";

type Audiences = {
	followers: GithubProfile[];
	following: GithubProfile[];
	ghosts: GithubProfile[];
};

type State = {
	user: GithubProfile | null;
	audiences: Audiences | null;
};

type Action =
	| {
			type: "USER_RESOLVE";
			user: GithubProfile;
	  }
	| {
			type: "FINISHED";
			audiences: Audiences;
	  };

const INITIAL_STATE: State = {
	user: null,
	audiences: null
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "USER_RESOLVE":
			return {
				...state,
				user: action.user
			};

		case "FINISHED":
			return {
				...state,
				audiences: {
					...state.audiences,
					...action.audiences
				}
			};

		default:
			break;
	}
	return state;
}

export function useAudience(credentials: Credentials, controller: AbortController) {
	const [steps, setSteps] = useState<{ steps: number; done: boolean }>();
	const handleSteps = (steps: number, done: boolean) => {
		setSteps({ steps, done });
	};
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

	useEffect(() => {
		if (!credentials.user) return;
		async function fetchAudience() {
			const user = await fetchUserProfile(credentials);
			dispatch({ type: "USER_RESOLVE", user });

			const [followers, following] = await Promise.all([
				fetchAllPages(credentials, "followers", (n) => console.log(n)),
				fetchAllPages(credentials, "following")
			]);

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

			const followingProfiles = resolve(following);
			const isGhost = new Set<number>(followers.map((follower) => follower.id));

			dispatch({
				type: "FINISHED",
				audiences: {
					ghosts: followingProfiles.filter(
						(following) => !isGhost.has(following.id)
					),
					followers: resolve(followers),
					following: followingProfiles
				}
			});
		}
		fetchAudience();
		return () => {
			controller.abort();
		};
	}, [credentials, controller]);

	const { user, audiences } = state;
	return {
		user,
		steps,
		...audiences
	};
}
