import { useCallback, useState } from "react";

import CredentialForm from "./components/CredentialForm";
import { useAudience } from "./hooks/useAudience";
import type { Credentials } from "./types/api.types";

import { LoadingView } from "./components/LoadingView";
import { Stat } from "@/components/Stat";
import { ErrorView } from "@/components/ErrorView";
import { WorldMap } from "@/components/WorldMap";

function App() {
	const [size, setSize] = useState<{ width: number; height: number } | null>(null);

	const [credentials, setCredentials] = useState<Credentials>({
		user: "",
		token: ""
	});

	const measureRef = useCallback((node: HTMLElement | null) => {
		if (node !== null) {
			const rect = node.getBoundingClientRect();
			console.log(rect.width, rect.height);
			setSize({
				width: rect.width,
				height: rect.height
			});
		}
	}, []);

	const { status, steps, error, pct, estimate, user, audience, resetAt } =
		useAudience(credentials);

	const isAuthorized = Boolean(credentials.user && credentials.token);

	if (!isAuthorized) return <CredentialForm onSubmit={setCredentials} />;

	return (
		<div className='min-h-screen bg-background flex flex-col'>
			{user && (
				<header className='border-b border-border bg-card'>
					<div className='max-w-6xl mx-auto px-6 py-3 flex items-center gap-4'>
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
								<a href={user.html_url} className='' target='_blank'>
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
				<div>
					{" "}
					{`remaining : ${estimate?.remaining} requests needed ${estimate?.requestsNeeded} it will exced ? : ${estimate?.willExceed} `}
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
				<div className='flex flex-1 items-stretch'>
					<main className='flex-1 overflow-y-auto' ref={measureRef}>
						<WorldMap
							width={size?.width as number}
							height={size?.height as number}
						/>
					</main>
					<aside className='w-64 shrink-0 border-l border-border bg-card p-6 hidden md:block'></aside>
				</div>
			)}
		</div>
	);
}

export default App;
