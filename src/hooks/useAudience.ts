import { useCallback, useEffect, useReducer } from "react";
import { geocode } from "../lib/geocode";
import {
	delay,
	fetchUserProfile,
	fetchAllAudience,
	RateLimitError,
	GithubApiError,
	estimateAudienceCost
} from "@/api/graphql.api";
import type {
	Step,
	GithubUserProfile,
	AudienceData,
	StepId,
	Credentials,
	GithubProfileNode,
	LocalizedGithubProfile,
	CostEstimate
} from "@/api/graphql.types";

const INITIAL_STEPS: Step[] = [
	{
		id: "fetch",
		label: "Fetching followers & following",
		status: "idle",
		detail: ""
	},
	{ id: "geocode", label: "Finding user's country", status: "idle", detail: "" },
	{ id: "done", label: "Building audience", status: "idle", detail: "" }
];

export type FetchStatus =
	| "idle"
	| "loading"
	| "success"
	| "error"
	| "quota_warning";

export type AudienceState = {
	status: FetchStatus;
	steps: Step[];
	pct: number;
	user: GithubUserProfile | null;
	audience: AudienceData | null;
	error: string | null;
	resetAt: Date | null;
	estimate: CostEstimate | null;
};

const initialState: AudienceState = {
	status: "idle",
	steps: INITIAL_STEPS,
	pct: 0,
	user: null,
	audience: null,
	error: null,
	resetAt: null,
	estimate: null
};

type Action =
	| { type: "FETCH_START" }
	| { type: "USER_RESOLVED"; user: GithubUserProfile }
	| { type: "STEP_UPDATE"; id: StepId; patch: Partial<Omit<Step, "id">> }
	| { type: "PROGRESS"; pct: number }
	| { type: "FETCH_SUCCESS"; audience: AudienceData; status: FetchStatus }
	| { type: "FETCH_ERROR"; message: string; resetAt?: Date }
	| { type: "RESET" }
	| { type: "QUOTA_WARNING"; estimate: CostEstimate };

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
		case "QUOTA_WARNING":
			return {
				...state,
				estimate: action.estimate,
				status: "quota_warning"
			};
		case "RESET":
			return initialState;

		default:
			break;
	}
	return state;
}

export type UseAudienceReturn = AudienceState & {
	proceed: () => void;
	abort: () => void;
};

export function useAudience(credentials: Credentials): UseAudienceReturn {
	const [state, dispatch] = useReducer(reducer, initialState);

	const updateStep = useCallback(
		(id: StepId, patch: Partial<Omit<Step, "id">>) =>
			dispatch({ type: "STEP_UPDATE", id, patch }),
		[]
	);

	const abort = useCallback(() => dispatch({ type: "RESET" }), []);

	const runFetch = useCallback(
		async function (
			credentials: Credentials,
			signal: AbortSignal,
			skipWarning = false
		) {
			dispatch({ type: "FETCH_START" });
			try {
				const { profile: user, rateLimit } = await fetchUserProfile(
					credentials.user,
					credentials.token,
					signal
				);
				dispatch({ type: "USER_RESOLVED", user });

				const estimate = estimateAudienceCost(
					user.followersCount,
					user.followingCount,
					rateLimit
				);
				if (estimate.willExceed && !skipWarning) {
					dispatch({ type: "QUOTA_WARNING", estimate });
					return;
				}

				updateStep("fetch", {
					status: "active",
					detail: "0 followers · 0 following"
				});

				let followersDone = 0;
				let followingDone = 0;
				const reportFetchProgress = () =>
					updateStep("fetch", {
						detail: `${followersDone} followers · ${followingDone} following…`
					});

				const [followers, following] = await Promise.all([
					fetchAllAudience(
						credentials.user,
						"followers",
						credentials.token,
						(done) => {
							followersDone = done;
							reportFetchProgress();
						},
						signal
					),
					fetchAllAudience(
						credentials.user,
						"following",
						credentials.token,
						(done) => {
							followingDone = done;
							reportFetchProgress();
						},
						signal
					)
				]);

				updateStep("fetch", {
					status: "done",
					detail: `${followers.length} followers · ${following.length} following`
				});
				dispatch({ type: "PROGRESS", pct: 40 });

				const uniqueProfiles = new Map<string, GithubProfileNode>();
				for (const profile of [...followers, ...following]) {
					uniqueProfiles.set(profile.login, profile);
				}

				updateStep("geocode", { status: "active", detail: "computing…" });
				const { profileCountryMap } = await geocode(
					[...uniqueProfiles.values()],
					({ done, total }) => {
						updateStep("geocode", { detail: `${done} / ${total}` });
						dispatch({
							type: "PROGRESS",
							pct: 40 + Math.round((done / total) * 60)
						});
					}
				);
				updateStep("geocode", { status: "done" });

				const resolve = (profiles: GithubProfileNode[]): LocalizedGithubProfile[] =>
					profiles.flatMap((profile) => {
						const country = profileCountryMap.get(profile.login);
						return country ? [{ ...profile, country }] : [];
					});
				const computeGhosts = <T extends { login: string }>(
					followers: T[],
					following: T[]
				): T[] => {
					const followerLogins = new Set(followers.map((f) => f.login));
					return following.filter((f) => !followerLogins.has(f.login));
				};

				const followerProfiles = resolve(followers);
				const followingProfiles = resolve(following);
				const ghosts = computeGhosts(followerProfiles, followingProfiles);

				updateStep("done", { status: "done", detail: "All data loaded" });
				dispatch({ type: "PROGRESS", pct: 100 });

				await delay(1100);

				dispatch({
					type: "FETCH_SUCCESS",
					audience: {
						followers: followerProfiles,
						following: followingProfiles,
						ghosts
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
		},
		[updateStep]
	);

	const proceed = useCallback(() => {
		const controller = new AbortController();
		dispatch({ type: "FETCH_START" });
		runFetch(credentials, controller.signal, true);
	}, [credentials, runFetch]);

	useEffect(() => {
		const { user } = credentials;
		if (!user) {
			dispatch({ type: "RESET" });
			return;
		}
		const controller = new AbortController();
		const { signal } = controller;

		runFetch(credentials, signal);
		return () => {
			controller.abort();
		};
	}, [credentials, runFetch]);

	return { ...state, abort, proceed };
}
