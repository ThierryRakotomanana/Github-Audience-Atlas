import { useCallback, useEffect, useReducer } from "react";
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
	| { type: "FETCH_SUCCESS"; audience: AudienceData }
	| { type: "RESET" };

function reducer(state: AudienceState, action: Action): AudienceState {
	switch (action.type) {
		case "FETCH_START":
			return { ...initialState, status: "loading" };
		case "USER_RESOLVED":
			return {
				...state,
				user: action.user
			};
		case "STEP_UPDATE":
			return {
				...state,
				steps: state.steps.map((step) =>
					step.id === action.id ? { ...step, ...action.patch } : step
				)
			};
		case "FETCH_SUCCESS":
			return {
				...state,
				audience: {
					...state.audience,
					...action.audience
				}
			};
		case "RESET":
			return initialState;

		default:
			break;
	}
	return state;
}

export function useAudience(credentials: Credentials) {
	const [state, dispatch] = useReducer(reducer, initialState);

	const updateStep = useCallback(
		(id: StepId, patch: Partial<Omit<Step, "id">>) =>
			dispatch({ type: "STEP_UPDATE", id, patch }),
		[]
	);

	useEffect(() => {
		const { user, token } = credentials;
		if (!user && !token) {
			dispatch({ type: "RESET" });
			return;
		}

		dispatch({ type: "FETCH_START" });
		async function fetchAudience() {
			const user = await fetchUserProfile(credentials);
			dispatch({ type: "USER_RESOLVED", user });

			const [rawFollowers, rawFollowing] = await Promise.all([
				fetchAllPages(credentials, "followers", (n) =>
					updateStep("fetch", { detail: `${n} followers…` })
				),
				fetchAllPages(credentials, "following")
			]);

			updateStep("fetch", {
				status: "done",
				detail: `${rawFollowers.length} followers · ${rawFollowing.length} following`
			});
			dispatch({ type: "PROGRESS", pct: 20 });

			const uniqueLogins = [
				...new Set(
					[...rawFollowers, ...rawFollowing].map((audience) => audience.login)
				)
			];

			updateStep("profiles", {
				status: "active",
				detail: `0 / ${uniqueLogins.length}`
			});

			const audienceProfiles = await fetchAudiencesProfiles(
				uniqueLogins,
				credentials.token,
				({ done, total }) => {
					updateStep("profiles", { detail: `${done} / ${total}` });
					dispatch({ type: "PROGRESS", pct: 20 + Math.round((done / total) * 75) });
				}
			);

			const resolve = (rawAudiences: GithubUser[]): GithubProfile[] => {
				return rawAudiences.flatMap((rawAudience) => {
					const profile = audienceProfiles.get(rawAudience.login);
					return profile ? profile : [];
				});
			};

			const followingProfiles = resolve(rawFollowing);
			const isGhost = new Set<number>(rawFollowers.map((follower) => follower.id));

			dispatch({
				type: "FETCH_SUCCESS",
				audience: {
					ghosts: followingProfiles.filter(
						(following) => !isGhost.has(following.id)
					),
					followers: resolve(rawFollowers),
					following: followingProfiles
				}
			});
		}
		fetchAudience();
		return () => {};
	}, [credentials, updateStep]);

	const { user, audience } = state;
	return {
		user,
		...audience
	};
}
