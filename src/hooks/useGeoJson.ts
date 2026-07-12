import { useEffect, useReducer, useCallback } from "react";

interface FetchState<T> {
	data: T | null;
	isLoading: boolean;
	error: boolean;
	reloadKey: number;
}

type FetchAction<T> =
	| { type: "FETCH_START" }
	| { type: "FETCH_SUCCESS"; payload: T }
	| { type: "FETCH_ERROR" }
	| { type: "RETRY" };

function fetchReducer<T>(
	state: FetchState<T>,
	action: FetchAction<T>
): FetchState<T> {
	switch (action.type) {
		case "FETCH_START":
			return { ...state, isLoading: true, error: false };
		case "FETCH_SUCCESS":
			return { ...state, isLoading: false, error: false, data: action.payload };
		case "FETCH_ERROR":
			return { ...state, isLoading: false, error: true };
		case "RETRY":
			return { ...state, reloadKey: state.reloadKey + 1 };
		default:
			return state;
	}
}

export function useGeoJson<T>(url: string) {
	const [state, dispatch] = useReducer(fetchReducer<T>, {
		data: null,
		isLoading: true,
		error: false,
		reloadKey: 0
	});

	useEffect(() => {
		const controller = new AbortController();
		dispatch({ type: "FETCH_START" });

		fetch(url, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Request failed (${response.status})`);
				}
				return response.json() as Promise<T>;
			})
			.then((jsonData) => {
				dispatch({ type: "FETCH_SUCCESS", payload: jsonData });
			})
			.catch((err) => {
				if (controller.signal.aborted) return;
				console.error(`Failed to load ${url}:`, err);
				dispatch({ type: "FETCH_ERROR" });
			});

		return () => controller.abort();
	}, [url, state.reloadKey]);

	const retry = useCallback(() => {
		dispatch({ type: "RETRY" });
	}, []);

	return {
		data: state.data,
		isLoading: state.isLoading,
		error: state.error,
		retry
	};
}
