// useAudience.ts
import { useCallback, useEffect, useReducer, useRef } from "react";
import { geocode } from "../lib/geocode";
import {
	delay,
	fetchUserProfile,
	fetchAllAudience,
	RateLimitError,
	GithubApiError,
	estimateAudienceCost,
	quotaBuffer
} from "@/api/graphql.api";
import {
	fetchAllAudienceReconciled,
	estimateReconciliationCost
} from "../api/reconcile";
import type {
	Step,
	GithubUserProfile,
	AudienceData,
	StepId,
	Credentials,
	GithubProfileNode,
	LocalizedGithubProfile,
	CostEstimate,
	ReconcileStage
} from "@/api/graphql.types";
import { TokenPool } from "@/api/token-pool";

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

const FOLLOWING_STAGE_LABEL: Record<ReconcileStage, string> = {
	graphql: "",
	rest: " (cross-checking)",
	backfill: " (recovering missed profiles)"
};

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
	partialCount: number | null;
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
	partialCount: null,
	estimate: null
};

type Action =
	| { type: "FETCH_START" }
	| { type: "USER_RESOLVED"; user: GithubUserProfile }
	| { type: "FOLLOWING_COUNT_CORRECTED"; count: number }
	| { type: "STEP_UPDATE"; id: StepId; patch: Partial<Omit<Step, "id">> }
	| { type: "PROGRESS"; pct: number }
	| { type: "FETCH_SUCCESS"; audience: AudienceData; status: FetchStatus }
	| { type: "FETCH_ERROR"; message: string; resetAt?: Date; partialCount?: number }
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
		case "FOLLOWING_COUNT_CORRECTED":
			if (!state.user || state.user.followingCount === action.count) return state;
			return {
				...state,
				user: { ...state.user, followingCount: action.count }
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
				user: state.user,
				error: action.message,
				resetAt: action.resetAt ?? null,
				partialCount: action.partialCount ?? null,
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
	const controllerRef = useRef<AbortController | null>(null);

	const updateStep = useCallback(
		(id: StepId, patch: Partial<Omit<Step, "id">>) =>
			dispatch({ type: "STEP_UPDATE", id, patch }),
		[]
	);

	const abort = useCallback(() => {
		controllerRef.current?.abort();
		dispatch({ type: "RESET" });
	}, []);

	const runFetch = useCallback(
		async function (
			credentials: Credentials,
			signal: AbortSignal,
			skipWarning = false
		) {
			dispatch({ type: "FETCH_START" });
			const dispatchFetchError = (error: unknown) => {
				if (error instanceof Error && error.name === "AbortError") return;
				if (error instanceof RateLimitError) {
					dispatch({
						type: "FETCH_ERROR",
						message: error.message,
						resetAt: error.resetAt,
						partialCount: error.partialNodes.length
					});
					return;
				}
				dispatch({
					type: "FETCH_ERROR",
					message:
						error instanceof GithubApiError ?
							error.message
						:	"An unexpected error occurred. Please try again"
				});
			};

			try {
				const tokenPool = new TokenPool(
					`${import.meta.env.VITE_DEMO_GITHUB_TOKENS},${credentials.token}`
						.split(",")
						.map((t: string) => t.trim())
						.filter(Boolean)
				);
				const { profile: user, rateLimit } = await fetchUserProfile(
					credentials.user,
					tokenPool,
					signal
				);
				dispatch({ type: "USER_RESOLVED", user });
				const baseEstimate = estimateAudienceCost(
					user.followersCount,
					user.followingCount,
					rateLimit
				);
				const backfillEstimate = estimateReconciliationCost(user.followingCount);
				const combinedPoints =
					baseEstimate.pointsNeeded + backfillEstimate.worstCaseBackfillPoints;
				const estimate: CostEstimate = {
					...baseEstimate,
					pointsNeeded: combinedPoints,
					willExceed:
						combinedPoints > baseEstimate.remaining - quotaBuffer(rateLimit)
				};
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
				let followingStage: ReconcileStage = "graphql";
				const reportFetchProgress = () =>
					updateStep("fetch", {
						detail: `${followersDone} followers · ${followingDone} following${FOLLOWING_STAGE_LABEL[followingStage]}…`
					});

				const followersPromise = fetchAllAudience(
					credentials.user,
					"followers",
					tokenPool,
					(done) => {
						followersDone = done;
						reportFetchProgress();
					},
					signal
				);
				const followingPromise = fetchAllAudienceReconciled(
					credentials.user,
					"following",
					tokenPool,
					(stage, done, total) => {
						followingStage = stage;
						followingDone = done;
						if (stage === "backfill" && total !== null) {
							dispatch({ type: "FOLLOWING_COUNT_CORRECTED", count: total });
						}
						reportFetchProgress();
					},
					signal
				);

				const [followersSettled, followingSettled] = await Promise.allSettled([
					followersPromise,
					followingPromise
				]);

				if (followersSettled.status === "rejected") {
					dispatchFetchError(followersSettled.reason);
					return;
				}
				if (followingSettled.status === "rejected") {
					dispatchFetchError(followingSettled.reason);
					return;
				}

				const followers = followersSettled.value.nodes;
				const followingResult = followingSettled.value;
				const following = followingResult.nodes;

				updateStep("fetch", {
					status: "done",
					detail: `${followers.length} followers · ${following.length} following${
						followingResult.recoveredLogins.length ?
							` (+${followingResult.recoveredLogins.length} recovered)`
						:	""
					}`
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

				const attachCountry = (
					profiles: GithubProfileNode[]
				): LocalizedGithubProfile[] =>
					profiles.flatMap((profile) => {
						const country = profileCountryMap.get(profile.login);
						return country ? [{ ...profile, country }] : [];
					});
				const computeGhosts = <T extends { login: string }>(
					followerList: T[],
					followingList: T[]
				): T[] => {
					const followerLogins = new Set(followerList.map((f) => f.login));
					return followingList.filter((f) => !followerLogins.has(f.login));
				};

				const followerProfiles = attachCountry(followers);
				const followingProfiles = attachCountry(following);
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
				dispatchFetchError(error);
				return;
			}
		},
		[updateStep]
	);

	const proceed = useCallback(() => {
		controllerRef.current?.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		runFetch(credentials, controller.signal, true);
	}, [credentials, runFetch]);

	useEffect(() => {
		const { user } = credentials;
		if (!user) {
			controllerRef.current?.abort();
			dispatch({ type: "RESET" });
			return;
		}
		const controller = new AbortController();
		controllerRef.current = controller;

		runFetch(credentials, controller.signal);
		return () => {
			controller.abort();
		};
	}, [credentials, runFetch]);

	return { ...state, abort, proceed };
}
