import { useEffect, useReducer, useState } from "react";
import type {
	AudienceData,
	Credentials,
	GithubProfile,
	GithubUser,
	Step,
	StepId
} from "../types/api.types";
import {
	fetchAllPages,
	fetchAudiencesProfiles,
	fetchUserProfile
} from "../api/github";

const INITIAL_STEPS: Step[] = [
	{
		id: "fetch",
		label: "Fetching followers & following",
		status: "idle",
		detail: ""
	},
	{ id: "profiles", label: "Loading profiles", status: "idle", detail: "" },
	{ id: "done", label: "Building audience", status: "idle", detail: "" }
];
export type FetchStatus = "idle" | "loading" | "success" | "error";

export type AudienceState = {
	status: FetchStatus;
	steps: Step[];
	pct: number;
	user: GithubProfile | null;
	audience: AudienceData | null;
};

const initialState: AudienceState = {
	status: "idle",
	steps: INITIAL_STEPS,
	pct: 0,
	user: null,
	audience: null
};

type Action =
	| { type: "FETCH_START" }
	| { type: "USER_RESOLVED"; user: GithubProfile }
	| { type: "STEP_UPDATE"; id: StepId; patch: Partial<Omit<Step, "id">> }
	| { type: "PROGRESS"; pct: number }
	| { type: "FETCH_SUCCESS"; audience: AudienceData };

function reducer(state: AudienceState, action: Action): AudienceState {
	switch (action.type) {
		case "USER_RESOLVED":
			return {
				...state,
				user: action.user
			};

		case "FETCH_SUCCESS":
			return {
				...state,
				audience: {
					...state.audience,
					...action.audience
				}
			};

		default:
			break;
	}
	return state;
}

export function useAudience(credentials: Credentials) {
	const [steps, setSteps] = useState<{ steps: number; done: boolean }>();
	const handleSteps = (steps: number, done: boolean) => {
		setSteps({ steps, done });
	};
	const [state, dispatch] = useReducer(reducer, initialState);

	useEffect(() => {
		if (!credentials.user) return;
		async function fetchAudience() {
			const user = await fetchUserProfile(credentials);
			dispatch({ type: "USER_RESOLVED", user });

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
				type: "FETCH_SUCCESS",
				audience: {
					ghosts: followingProfiles.filter(
						(following) => !isGhost.has(following.id)
					),
					followers: resolve(followers),
					following: followingProfiles
				}
			});
		}
		fetchAudience();
		return () => {};
	}, [credentials]);

	const { user, audience } = state;
	return {
		user,
		steps,
		...audience
	};
}
