import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Credentials } from "../types/api.types";

const GithubIcon = () => (
	<svg
		width='20'
		height='20'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.75'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' />
	</svg>
);

export default function CredentialForm({
	onSubmit
}: {
	onSubmit: (c: Credentials) => void;
}) {
	const [form, setForm] = useState<Credentials>({ user: "", token: "" });
	const valid = form.user.trim() && form.token.trim();

	return (
		<div className='min-h-svh flex items-center justify-center bg-background p-8'>
			<Card className='w-full max-w-sm border-border shadow-lg'>
				<CardHeader className='items-center text-center gap-3 pb-2'>
					<div className='w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary'>
						<GithubIcon />
					</div>
					<div>
						<h1 className='text-xl font-medium tracking-tight text-card-foreground'>
							Audience Atlas
						</h1>
						<p className='text-sm text-muted-foreground mt-1 leading-snug'>
							Connect your GitHub account
							<br />
							to explore your audience
						</p>
					</div>
				</CardHeader>

				<CardContent className='pt-4 flex flex-col gap-5'>
					<div className='flex flex-col gap-2'>
						<Label
							htmlFor='user'
							className='text-xs font-medium text-muted-foreground'>
							GitHub Username
						</Label>
						<div className='relative'>
							<UserIcon />
							<Input
								id='user'
								type='text'
								placeholder='e.g. torvalds'
								value={form.user}
								onChange={(e) => setForm((f) => ({ ...f, user: e.target.value }))}
								className='pl-9 font-mono text-sm focus-visible:ring-primary'
								autoComplete='off'
								spellCheck={false}
							/>
						</div>
					</div>

					<div className='flex flex-col gap-2'>
						<Label
							htmlFor='token'
							className='text-xs font-medium text-muted-foreground'>
							Personal Access Token
						</Label>
						<div className='relative'>
							<LockIcon />
							<Input
								id='token'
								type='password'
								placeholder='ghp_xxxxxxxxxxxx'
								value={form.token}
								onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
								className='pl-9 font-mono text-sm focus-visible:ring-primary'
								autoComplete='off'
								spellCheck={false}
							/>
						</div>
					</div>

					<Button
						className='w-full mt-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium'
						disabled={!valid}
						onClick={() => valid && onSubmit(form)}>
						<svg
							className='w-4 h-4 mr-2'
							viewBox='0 0 24 24'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
							strokeLinejoin='round'>
							<path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' />
							<polyline points='10 17 15 12 10 7' />
							<line x1='15' y1='12' x2='3' y2='12' />
						</svg>
						Authorize
					</Button>

					<p className='text-center text-xs text-muted-foreground leading-relaxed border-t border-border pt-4'>
						Token requires{" "}
						<code className='bg-secondary text-secondary-foreground px-1 py-0.5 rounded text-[11px]'>
							read:user
						</code>{" "}
						and{" "}
						<code className='bg-secondary text-secondary-foreground px-1 py-0.5 rounded text-[11px]'>
							read:followers
						</code>{" "}
						scopes.{" "}
						<a
							href='https://github.com/settings/tokens'
							className='text-primary hover:underline'
							target='_blank'
							rel='noopener noreferrer'>
							Generate one →
						</a>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}

const UserIcon = () => (
	<svg
		className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
		<circle cx='12' cy='7' r='4' />
	</svg>
);
const LockIcon = () => (
	<svg
		className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
		<path d='M7 11V7a5 5 0 0 1 10 0v4' />
	</svg>
);
