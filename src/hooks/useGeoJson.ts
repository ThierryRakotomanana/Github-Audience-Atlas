import { useCallback, useEffect, useState } from "react";

export function useGeoJson<T>(url: string) {
	const [data, setData] = useState<T | null>(null);
	const [error, setError] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	const [prevUrl, setPrevUrl] = useState(url);
	if (url !== prevUrl) {
		setError(false);
		setPrevUrl(url);
		setIsLoading(true);
		setError(false);
		setData(null);
	}

	useEffect(() => {
		const controller = new AbortController();

		fetch(url, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) {
					throw new Error(`Request failed (${response.status})`);
				}
				return response.json() as Promise<T>;
			})
			.then(setData)
			.catch((err) => {
				if (controller.signal.aborted) return;
				console.error(`Failed to load ${url}:`, err);
				setError(true);
			});

		return () => controller.abort();
	}, [url, reloadKey]);

	const retry = useCallback(() => setReloadKey((k) => k + 1), []);

	return { data, isLoading, error, retry };
}
