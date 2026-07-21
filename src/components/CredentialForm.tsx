import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Eye,
	EyeOff,
	User,
	KeyRound,
	Info,
	ExternalLink,
	ArrowRight
} from "lucide-react";
import type { Credentials } from "@/api/graphql.types";
import { GithubIcon } from "@/components/icons/lucide-github";

const REQUIRED_SCOPES = ["read:user", "read:followers"] as const;
const UNFOLLOW_SCOPE = "user:follow";

export default function CredentialForm({
	onSubmit
}: {
	onSubmit: (c: Credentials) => void;
}) {
	const [username, setUsername] = useState("");
	const [token, setToken] = useState("");
	const [useCustomToken, setUseCustomToken] = useState(false);
	const [showToken, setShowToken] = useState(false);

	const isUsernameValid = username.trim().length > 0;
	const isTokenValid = !useCustomToken || token.trim().length > 0;
	const isValid = isUsernameValid && isTokenValid;

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isValid) return;

		onSubmit({
			user: username.trim(),
			token: useCustomToken ? token.trim() : ""
		});
	};

	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8'>
			<Card className='w-full max-w-md shadow-xl border-border/40 rounded-2xl bg-card'>
				<CardHeader className='text-center pb-4 pt-5 flex items-center justify-center'>
					<div className='rounded-lg p-2 border'>
						<GithubIcon size={32} />
					</div>
				</CardHeader>

				<form onSubmit={handleSubmit} className='flex flex-col'>
					<CardContent className='flex flex-col gap-5 pb-6'>
						<div className='flex flex-col gap-2.5'>
							<Label htmlFor='username' className='text-sm font-medium'>
								GitHub Username
							</Label>
							<div className='relative'>
								<User className='absolute left-3.5 top-3 h-4 w-4 text-muted-foreground' />
								<Input
									id='username'
									type='text'
									placeholder='e.g. torvalds'
									className='pl-10 h-11 rounded-xl bg-muted/20 border-border/50 focus-visible:bg-background transition-colors'
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									autoComplete='off'
									spellCheck={false}
								/>
							</div>
						</div>

						<div className='flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 transition-colors hover:bg-muted/30'>
							<Checkbox
								id='useCustomToken'
								checked={useCustomToken}
								onCheckedChange={(checked) => setUseCustomToken(checked === true)}
								className='mt-0.5 rounded-lg'
							/>
							<div className='flex flex-col gap-1.5'>
								<Label
									htmlFor='useCustomToken'
									className='cursor-pointer text-sm font-medium'>
									Use personal Access Token
								</Label>
								<p className='text-xs text-muted-foreground leading-relaxed'>
									Recommended for accounts with large audiences to unlock the 5,000
									req/h API limit.
								</p>
							</div>
						</div>

						{!useCustomToken ?
							<Alert className='rounded-xl border-border/50 bg-muted/20 pt-4 pb-4'>
								<Info className='h-4 w-4 text-muted-foreground' />
								<AlertTitle className='text-sm font-semibold'>
									Demo Mode Active
								</AlertTitle>
								<AlertDescription className='text-xs text-muted-foreground mt-1.5 leading-relaxed'>
									Requests will use a shared demo quota. Profiles with thousands of
									followers may hit rate limits.
								</AlertDescription>
							</Alert>
						:	<div className='flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200'>
								<div className='flex flex-col gap-2.5'>
									<div className='flex items-center justify-between'>
										<Label htmlFor='token' className='text-sm font-medium'>
											Access Token
										</Label>
										<span className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-0.5 rounded-full'>
											5,000 req/h
										</span>
									</div>
									<div className='relative'>
										<KeyRound className='absolute left-3.5 top-3 h-4 w-4 text-muted-foreground' />
										<Input
											id='token'
											type={showToken ? "text" : "password"}
											placeholder='ghp_xxxxxxxxxxxx'
											className='pl-10 pr-12 h-11 rounded-xl bg-muted/20 border-border/50 font-mono text-sm focus-visible:bg-background transition-colors'
											value={token}
											onChange={(e) => setToken(e.target.value)}
											autoComplete='off'
											spellCheck={false}
										/>
										<Button
											type='button'
											variant='ghost'
											size='icon'
											className='absolute right-1 top-1 h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50'
											onClick={() => setShowToken(!showToken)}>
											{showToken ?
												<EyeOff className='h-4 w-4' />
											:	<Eye className='h-4 w-4' />}
											<span className='sr-only'>Toggle token visibility</span>
										</Button>
									</div>
								</div>

								<div className='flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4'>
									<div className='flex flex-wrap items-center gap-2'>
										<span className='text-xs font-medium text-muted-foreground'>
											Required:
										</span>
										{REQUIRED_SCOPES.map((scope) => (
											<Badge
												key={scope}
												variant='secondary'
												className='font-mono text-[10px] font-normal rounded-md px-1.5 py-0.5'>
												{scope}
											</Badge>
										))}
									</div>
									<div className='flex flex-wrap items-center gap-2'>
										<span className='text-xs font-medium text-muted-foreground'>
											Upcoming:
										</span>
										<Badge
											variant='outline'
											className='font-mono text-[10px] font-normal rounded-md px-1.5 py-0.5 bg-transparent border-border/60'>
											{UNFOLLOW_SCOPE}
										</Badge>
									</div>
									<div className='pt-1'>
										<a
											href='https://github.com/settings/tokens'
											target='_blank'
											rel='noopener noreferrer'
											className='inline-flex items-center text-xs text-primary hover:text-primary/80 transition-colors font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary'>
											Generate a token on GitHub
											<ExternalLink className='ml-1.5 h-3 w-3' />
										</a>
									</div>
								</div>
							</div>
						}
					</CardContent>

					<CardFooter className='flex items-center'>
						<Button
							type='submit'
							className='w-full py-4 rounded-xl group font-medium text-sm transition-all'
							disabled={!isValid}>
							Generate Atlas
							<ArrowRight className='ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' />
						</Button>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}
