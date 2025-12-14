import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { Credentials } from "../types/api.types";

export default function CredentialForm({
	onSubmit
}: {
	onSubmit: (c: Credentials) => void;
}) {
	const [form, setForm] = useState<Credentials>({ user: "", token: "" });
	const valid = form.user.trim() && form.token.trim();
	const [showToken, setShowToken] = useState<boolean>(false);

	return (
		<div className='min-h-svh flex flex-col items-center justify-center bg-background gap-4'>
			<div className='flex flex-col gap-3 justify-center mb-6 text-center'>
				<div className='text-5xl'>🌍</div>
				<h1 className='text-3xl font-extrabold tracking-tight bg-magic-trinity bg-clip-text text-transparent'>
					AUDIENCE ATLAS
				</h1>
				<p className='text-xs text-muted-foreground'>
					followers · following · ghost zone
				</p>
			</div>
			<Card className='w-full max-w-md border-border shadow-lg font-light p-4'>
				<CardContent className='pt-4 pb-0 flex flex-col gap-5'>
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
						<div className='flex justify-between'>
							<Label
								htmlFor='token'
								className='text-xs font-medium text-muted-foreground'>
								Personal Access Token
							</Label>
							<Label className='text-xs font-medium text-muted-foreground'>
								5.000 req/h
							</Label>
						</div>

						<div className='relative text-muted-foreground'>
							<Button
								onClick={() => {
									setShowToken((show) => !show);
								}}
								variant={"ghost"}
								className='absolute left-0 hover:bg-none top-1/2 -translate-y-1/2 flex items-center'>
								{showToken ? "👁" : "🙈"}
							</Button>
							<Input
								id='token'
								type={showToken ? "text" : "password"}
								placeholder={"ghp_xxxxxxxxxxxx"}
								value={form.token}
								onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
								className='pl-9 font-mono text-sm focus-visible:ring-primary'
								autoComplete='off'
								spellCheck={false}
							/>
						</div>
					</div>

					<Button
						className='w-full mt-1 bg-blue-800 hover:bg-primary/90 text-primary-foreground font-medium p-5'
						disabled={!valid}
						onClick={() => valid && onSubmit(form)}>
						Generate Atlas →
					</Button>

					<p className='text-center text-xs text-muted-foreground leading-relaxed border-t border-border pt-4'>
						Token requires{" "}
						<code className='bg-secondary text-indigo-900 px-1 py-0.5 rounded text-[11px]'>
							read:user
						</code>{" "}
						and{" "}
						<code className='bg-secondary text-purple-950 px-1 py-0.5 rounded text-[11px]'>
							read:followers
						</code>{" "}
						scopes. <br />
						<a
							href='https://github.com/settings/tokens'
							className='text-primary hover:underline'
							target='_blank'
							rel='noopener noreferrer'>
							Generate one →
						</a>
						<p className='mt-3'>
							✓ Add{" "}
							<code className='bg-secondary text-blue-600 px-1 py-0.5 rounded text-[11px] mt-2'>
								user:follow
							</code>{" "}
							scope to unlock{" "}
							<code className='bg-secondary text-green-600 px-1 py-0.5 rounded text-[11px]'>
								Unfollow buttons
							</code>{" "}
							scopes.
						</p>
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
