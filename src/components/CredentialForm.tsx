import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, User, KeyRound } from "lucide-react";
import type { Credentials } from "../types/api.types";

const REQUIRED_SCOPES = ["read:user", "read:followers"] as const;
const UNFOLLOW_SCOPE = "user:follow";

export default function CredentialForm({
	onSubmit
}: {
	onSubmit: (c: Credentials) => void;
}) {
	const [form, setForm] = useState<Credentials>({ user: "", token: "" });
	const [showToken, setShowToken] = useState(false);

	const isValid = form.user.trim().length > 0 && form.token.trim().length > 0;

	function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (isValid) onSubmit(form);
	}

	return (
		<div className='min-h-svh flex flex-col items-center justify-center atlas-grid-bg gap-6 px-4 py-8'>
			<div className='flex flex-col items-center gap-3 text-center'>
				<div className='text-5xl'>🌍</div>
				<div>
					<h1 className='text-2xl sm:text-3xl font-extrabold text-blue-500 tracking-tight'>
						AUDIENCE ATLAS
					</h1>
					<p className='text-xs text-muted-foreground mt-1'>
						followers · following · ghost zone
					</p>
				</div>
			</div>

			<Card className='w-full max-w-md shadow-lg'>
				<form onSubmit={handleSubmit} noValidate>
					<CardContent className='flex flex-col gap-5 pt-6'>
						<div className='flex flex-col gap-2'>
							<Label
								htmlFor='user'
								className='text-xs font-normal text-muted-foreground/45'>
								GitHub Username
							</Label>
							<div className='relative'>
								<User className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
								<Input
									id='user'
									type='text'
									placeholder='e.g. torvalds'
									value={form.user}
									onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))}
									autoComplete='off'
									spellCheck={false}
									className='pl-9'
								/>
							</div>
						</div>

						<div className='flex flex-col gap-2'>
							<div className='flex items-center justify-between'>
								<Label
									htmlFor='token'
									className='text-xs font-normal text-muted-foreground'>
									Personal Access Token
								</Label>
								<span className='text-xs font-medium text-muted-foreground'>
									5,000 req/h
								</span>
							</div>
							<div className='relative'>
								<KeyRound className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
								<Input
									id='token'
									type={showToken ? "text" : "password"}
									placeholder='ghp_xxxxxxxxxxxx'
									value={form.token}
									onChange={(e) =>
										setForm((f) => ({ ...f, token: e.target.value }))
									}
									autoComplete='off'
									spellCheck={false}
									className='pl-9 pr-9'
								/>
								<button
									type='button'
									onClick={() => setShowToken((show) => !show)}
									aria-label={showToken ? "Hide token" : "Show token"}
									aria-pressed={showToken}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'>
									{showToken ?
										<EyeOff className='h-4 w-4' />
									:	<Eye className='h-4 w-4' />}
								</button>
							</div>
						</div>

						<Button
							type='submit'
							disabled={!isValid}
							size='lg'
							className='w-full font-medium'>
							Generate Atlas →
						</Button>

						<div className='flex flex-col gap-3 border-t border-border pt-4'>
							<div className='flex flex-wrap items-center gap-1.5'>
								<span className='text-xs text-muted-foreground'>
									Required scopes:
								</span>
								{REQUIRED_SCOPES.map((scope) => (
									<Badge
										key={scope}
										variant='outline'
										className='font-mono text-[11px] font-normal'>
										{scope}
									</Badge>
								))}
							</div>
							<div className='flex flex-wrap items-center gap-1.5'>
								<span className='text-xs text-muted-foreground'>
									For the next version, you will be able to unfollow:
								</span>
								<Badge
									variant='outline'
									className='font-mono text-[11px] font-normal'>
									{UNFOLLOW_SCOPE}
								</Badge>
							</div>
							<a
								href='https://github.com/settings/tokens'
								target='_blank'
								rel='noopener noreferrer'
								className='text-xs text-primary hover:underline text-center'>
								Generate a token →
							</a>
						</div>
					</CardContent>
				</form>
			</Card>
		</div>
	);
}
