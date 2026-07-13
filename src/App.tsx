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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
							<Separator orientation='vertical' className='h-4' />
							<a
								href={
									"https://github.com/ThierryRakotomanana/Github-Audience-Atlas"
								}
								target='_blank'
								rel='noreferrer'
								className='text-xs text-muted-foreground font-mono hover:text-foreground transition-colors'>
								<svg
									xmlns='http://w3.org'
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='currentColor'>
									<path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z' />
								</svg>
							</a>
						</div>
					</div>
				</header>
			)}

			{status === "success" && currentAudience && (
				<div className='border-b border-border bg-card shrink-0'>
					<div className='max-w-6xl mx-auto px-4 sm:px-6 py-1 flex items-center justify-between gap-3'>
						<Tabs
							value={audienceType}
							onValueChange={(v) => setAudienceType(v as AudienceType)}
							className='overflow-x-auto'>
							<TabsList>
								{AUDIENCE_TABS.map((tab) => (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className='text-xs sm:text-sm'>
										<Badge
											className={
												tab.value !== audienceType ? "bg-card" : "text-background"
											}>
											{tab.label}
										</Badge>
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
