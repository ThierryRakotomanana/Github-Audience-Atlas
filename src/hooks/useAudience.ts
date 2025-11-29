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
	delay,
	fetchAllPages,
	fetchAudiencesProfiles,
	fetchUserProfile,
	GithubApiError,
	RateLimitError
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
	error: string | null;
	resetAt: Date | null;
};

const initialState: AudienceState = {
	status: "idle",
	steps: INITIAL_STEPS,
	pct: 0,
	user: null,
	audience: null,
	error: null,
	resetAt: null
};

type Action =
	| { type: "FETCH_START" }
	| { type: "USER_RESOLVED"; user: GithubProfile }
	| { type: "STEP_UPDATE"; id: StepId; patch: Partial<Omit<Step, "id">> }
	| { type: "PROGRESS"; pct: number }
	| { type: "FETCH_SUCCESS"; audience: AudienceData; status: FetchStatus }
	| { type: "FETCH_ERROR"; message: string; resetAt?: Date }
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
		case "PROGRESS":
			return {
				...state,
				pct: action.pct
			};
		case "FETCH_SUCCESS":
			return {
				...state,
				audience: {
					...state.audience,
					...action.audience
				},
				status: action.status
			};
		case "FETCH_ERROR":
			return {
				...initialState,
				error: action.message,
				resetAt: action.resetAt ?? null,
				status: "error"
			};
		case "RESET":
			return initialState;

		default:
			break;
	}
	return state;
}

export function useAudience(credentials: Credentials): AudienceState {
	const [state, dispatch] = useReducer(reducer, initialState);

	const updateStep = useCallback(
		(id: StepId, patch: Partial<Omit<Step, "id">>) =>
			dispatch({ type: "STEP_UPDATE", id, patch }),
		[]
	);

	useEffect(() => {
		const { user } = credentials;
		if (!user) {
			dispatch({ type: "RESET" });
			return;
		}
		const controller = new AbortController();
		const { signal } = controller;
		dispatch({ type: "FETCH_START" });
		async function fetchAudience() {
			try {
				const { data: user } = await fetchUserProfile({ ...credentials, signal });
				dispatch({ type: "USER_RESOLVED", user });

				updateStep("fetch", {
					status: "active",
					detail: "0 followers 0 following"
				});

				const [rawFollowers, rawFollowing] = await Promise.all([
					fetchAllPages(credentials, "followers", signal, (n) =>
						updateStep("fetch", { detail: `${n} followers…` })
					),
					fetchAllPages(credentials, "following", signal, (n) =>
						updateStep("fetch", {
							detail: `${n} following…`
						})
					)
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
					signal,
					({ done, total }) => {
						updateStep("profiles", { detail: `${done} / ${total}` });
						dispatch({
							type: "PROGRESS",
							pct: 20 + Math.round((done / total) * 75)
						});
					}
				);

				updateStep("profiles", { status: "done" });

				updateStep("done", { status: "active", detail: "computing…" });
				const resolve = (rawAudiences: GithubUser[]): GithubProfile[] => {
					return rawAudiences.flatMap((rawAudience) => {
						const profile = audienceProfiles.get(rawAudience.login);
						return profile ? profile : [];
					});
				};

				const followingProfiles = resolve(rawFollowing);
				const isGhost = new Set<number>(
					rawFollowers.map((follower) => follower.id)
				);

				updateStep("done", { status: "done", detail: "All data loaded" });
				dispatch({ type: "PROGRESS", pct: 100 });

				await delay(1100);

				dispatch({
					type: "FETCH_SUCCESS",
					audience: {
						ghosts: followingProfiles.filter(
							(following) => !isGhost.has(following.id)
						),
						followers: resolve(rawFollowers),
						following: followingProfiles
					},
					status: "success"
				});
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") return;
				if (error instanceof RateLimitError) {
					dispatch({
						type: "FETCH_ERROR",
						message: error.message,
						resetAt: error.resetAt
					});
					return;
				}
				dispatch({
					type: "FETCH_ERROR",
					message:
						error instanceof GithubApiError ?
							error.message
						:	`An unexpected error occurred. Please try again`
				});
				return;
			}
		}
		fetchAudience();
		return () => {
			controller.abort();
		};
	}, [credentials, updateStep]);

	return state;
}
