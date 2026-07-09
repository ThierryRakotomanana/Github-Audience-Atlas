import { useState, useEffect, useRef } from "react";

import CredentialForm from "./components/CredentialForm";
import { useAudience } from "./hooks/useAudience";
import type { Credentials } from "./types/api.types";

import { LoadingView } from "./components/LoadingView";
import { Stat } from "@/components/Stat";
import { ErrorView } from "@/components/ErrorView";
import { WorldMap } from "@/components/WorldMap";
import { CountryList } from "@/components/CountryList";

function App() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState<{ width: number; height: number } | null>(null);
	const [country, setCountry] = useState<string>("NO_COUNTRY_SELECTED");

	const [credentials, setCredentials] = useState<Credentials>({
		user: "",
		token: ""
	});

	const { status, steps, error, pct, estimate, user, audience, resetAt } =
		useAudience(credentials);

	useEffect(() => {
		if (status !== "success" || !containerRef.current) return;

		const container = containerRef.current;

		const resizeObserver = new ResizeObserver((entries) => {
			if (!entries || entries.length === 0) return;
			const { width, height } = entries[0].contentRect;
			setSize({ width, height });
		});

		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
		};
	}, [status]);

	const isAuthorized = Boolean(credentials.user && credentials.token);

	if (!isAuthorized) return <CredentialForm onSubmit={setCredentials} />;

	return (
		<div className='h-screen w-screen overflow-hidden bg-background flex flex-col'>
			{user && (
				<header className='border-b border-border bg-card'>
					<div className='max-w-6xl mx-auto px-6 py-1 flex items-center gap-4'>
						<img
							src={user.avatar_url}
							alt={user.login}
							className='w-9 h-9 rounded-full border border-border shrink-0'
						/>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium text-card-foreground truncate'>
								{user.name ?? user.login}
							</p>
							<p className='text-xs text-muted-foreground font-mono'>
								<a href={user.html_url} target='_blank' rel='noreferrer'>
									@{user.login}
								</a>
							</p>
						</div>
						<div className='flex items-center gap-6 shrink-0'>
							<Stat label='Followers' value={user.followers} />
							<Stat label='Following' value={user.following} />
						</div>
					</div>
				</header>
			)}

			{status === "loading" && <LoadingView steps={steps} pct={pct} />}

			{status === "quota_warning" && (
				<div className='p-6 text-sm border-b border-warning bg-warning/10 text-warning-foreground'>
					Remaining: {estimate?.remaining} requests needed:{" "}
					{estimate?.requestsNeeded}. Will exceed?{" "}
					{estimate?.willExceed ? "Yes" : "No"}
				</div>
			)}

			{status === "error" && error && (
				<ErrorView
					message={error}
					resetAt={resetAt}
					onRetry={() => setCredentials({ user: "", token: "" })}
				/>
			)}

			{status === "success" && audience && (
				<div className='flex flex-1 items-stretch min-h-0 h-0 w-full overflow-hidden'>
					<main className='flex-1 overflow-hidden relative' ref={containerRef}>
						{size ?
							<WorldMap
								width={size.width}
								height={size.height}
								setCountry={setCountry}
								audience={audience}
							/>
						:	<div className='absolute inset-0 flex items-center justify-center text-sm text-muted-foreground'>
								Calculating map dimensions...
							</div>
						}
					</main>
					<aside className='w-64 shrink-0 border-l border-border bg-card p-6 hidden md:block'>
						<CountryList
							data={audience}
							country={country}
							setCountry={(country) => setCountry(country)}
						/>
					</aside>
				</div>
			)}
			<footer className='h-8 w-full border-t border-border bg-muted/40 px-6 flex items-center justify-between text-xs text-muted-foreground shrink-0'>
				<p>© 2026 Your Company</p>
				<div className='flex gap-4'>
					<a href='#' className='hover:underline'>
						Privacy
					</a>
					<a href='#' className='hover:underline'>
						Terms
					</a>
				</div>
			</footer>
		</div>
	);
}

export default App;
