import { useState } from "react";

import CredentialForm from "./components/CredentialForm";
import { useAudience } from "./hooks/useAudience";
import { useElementSize } from "./hooks/useElementSize";
import type { Credentials } from "./types/api.types";

import { LoadingView } from "./components/LoadingView";
import { Stat } from "@/components/Stat";
import { ErrorView } from "@/components/ErrorView";
import { WorldMap } from "@/components/WorldMap";
import { CountryList } from "@/components/CountryList";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger
} from "@/components/ui/sheet";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, List, Loader2 } from "lucide-react";

type AudienceType = "followers" | "following" | "ghosts";

const AUDIENCE_TABS: { value: AudienceType; label: string }[] = [
	{ value: "followers", label: "Followers" },
	{ value: "following", label: "Following" },
	{ value: "ghosts", label: "Ghost Zone" }
];

function App() {
	const [country, setCountry] = useState<string | null>(null);
	const [audienceType, setAudienceType] = useState<AudienceType>("followers");
	const [credentials, setCredentials] = useState<Credentials>({
		user: "",
		token: ""
	});

	const { ref: mapContainerRef, size } = useElementSize<HTMLDivElement>();
	const { status, steps, error, pct, estimate, user, audience, resetAt } =
		useAudience(credentials);

	const isAuthorized = Boolean(credentials.user && credentials.token);
	if (!isAuthorized) return <CredentialForm onSubmit={setCredentials} />;

	const currentAudience = audience?.[audienceType];

	return (
		<div className='h-screen w-screen overflow-hidden bg-background flex flex-col'>
			{user && (
				<header className='border-b border-border bg-card shrink-0'>
					<div className='max-w-6xl mx-auto px-4 sm:px-6 py-1 flex items-center gap-3 sm:gap-4'>
						<img
							src={user.avatar_url}
							alt={user.login}
							className='w-8 h-8 rounded-full border border-border shrink-0'
						/>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium text-card-foreground truncate'>
								{user.name ?? user.login}
							</p>
							<a
								href={user.html_url}
								target='_blank'
								rel='noreferrer'
								className='text-xs text-muted-foreground font-mono hover:text-foreground transition-colors'>
								@{user.login}
							</a>
						</div>
						<div className='flex items-center gap-4 sm:gap-6 shrink-0'>
							<Stat label='Followers' value={user.followers} />
							<Stat label='Following' value={user.following} />
						</div>
					</div>
				</header>
			)}

			{status === "success" && currentAudience && (
				<div className='border-b border-border bg-card shrink-0'>
					<div className='max-w-6xl mx-auto px-4 sm:px-6 py-1 flex items-center justify-between gap-3'>
						<Tabs
							value={audienceType}
							onValueChange={(v) => setAudienceType(v as AudienceType)}>
							<TabsList className='bg-muted'>
								{AUDIENCE_TABS.map((tab) => (
									<TabsTrigger key={tab.value} value={tab.value}>
										{tab.label}
									</TabsTrigger>
								))}
							</TabsList>
						</Tabs>

						<Sheet>
							<SheetTrigger asChild>
								<Button
									variant='outline'
									size='icon'
									className='shrink-0 md:hidden'>
									<List className='h-4 w-4' />
									<span className='sr-only'>View country breakdown</span>
								</Button>
							</SheetTrigger>
							<SheetContent side='right' className='w-72'>
								<SheetHeader>
									<SheetTitle>Countries</SheetTitle>
								</SheetHeader>
								<CountryList
									data={currentAudience}
									country={country}
									setCountry={setCountry}
								/>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			)}

			{status === "loading" && <LoadingView steps={steps} pct={pct} />}

			{status === "quota_warning" && estimate && (
				<div className='flex-1 flex items-center justify-center p-4'>
					<Alert className='max-w-md border-warning bg-warning/10 text-warning-foreground [&>svg]:text-warning-foreground'>
						<AlertTriangle className='h-4 w-4' />
						<AlertTitle>Approaching rate limit</AlertTitle>
						<AlertDescription className='text-warning-foreground/90'>
							{estimate.remaining} requests remaining, {estimate.requestsNeeded}{" "}
							needed to finish.{" "}
							{estimate.willExceed ?
								"This will likely exceed your quota."
							:	"You should have enough headroom to complete."}
						</AlertDescription>
					</Alert>
				</div>
			)}

			{status === "error" && error && (
				<ErrorView
					message={error}
					resetAt={resetAt}
					onRetry={() => setCredentials({ user: "", token: "" })}
				/>
			)}

			{status === "success" && currentAudience && (
				<div className='flex flex-1 items-stretch min-h-0 h-0 w-full overflow-hidden'>
					<main ref={mapContainerRef} className='flex-1 overflow-hidden relative'>
						{size ?
							<WorldMap
								width={size.width}
								height={size.height}
								setCountry={setCountry}
								audience={currentAudience}
							/>
						:	<div className='absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground'>
								<Loader2 className='h-4 w-4 animate-spin' />
								Calculating map dimensions...
							</div>
						}
					</main>
					<aside className='w-64 shrink-0 border-l border-border bg-card py-6 pl-6 pr-2 hidden md:block'>
						<CountryList
							data={currentAudience}
							country={country}
							setCountry={setCountry}
						/>
					</aside>
				</div>
			)}

			<footer className='h-10 w-full border-t border-border bg-muted/40 px-4 sm:px-6 flex items-center justify-between text-xs text-muted-foreground shrink-0'>
				<p>© 2026 Atlas Audience</p>
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
