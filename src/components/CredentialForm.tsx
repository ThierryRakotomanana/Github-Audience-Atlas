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
		<div className='min-h-svh flex flex-col items-center justify-center atlas-grid-bg  gap-4'>
			<div className='flex flex-col gap-5 justify-center mb-6 text-center'>
				<div className='text-5xl'>🌍</div>
				<div>
					<h1 className='text-3xl font-extrabold atlas-brand-text'>
						AUDIENCE ATLAS
					</h1>
					<p className='text-xs'>followers · following · ghost zone</p>
				</div>
			</div>
			<Card className='w-full max-w-md border-border shadow-lg font-light p-4'>
				<CardContent className='pt-4 pb-0 flex flex-col gap-5'>
					<div className='flex flex-col gap-2'>
						<Label htmlFor='user' className='text-xs font-light'>
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
								autoComplete='off'
								spellCheck={false}
								className='pl-8'
							/>
						</div>
					</div>

					<div className='flex flex-col gap-2'>
						<div className='flex justify-between'>
							<Label htmlFor='token' className='text-xs font-light'>
								Personal Access Token
							</Label>
							<Label className='text-xs font-medium text-muted-foreground'>
								5.000 req/h
							</Label>
						</div>

						<div className='relative text-muted-foreground'>
							<button
								onClick={() => {
									setShowToken((show) => !show);
								}}
								className='absolute left-3 top-1/2 translate-x- -translate-y-1/2 w-4 h-4 hover:bg-none flex items-center'>
								{showToken ? "👁" : "🙈"}
							</button>
							<Input
								id='token'
								type={showToken ? "text" : "password"}
								placeholder={"ghp_xxxxxxxxxxxx"}
								value={form.token}
								onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
								autoComplete='off'
								spellCheck={false}
								className='pl-8'
							/>
						</div>
					</div>

					<Button
						className='w-full mt-1 bg-blue-800 hover:bg-primary/90 text-slate-100 font-medium p-5'
						disabled={!valid}
						onClick={() => valid && onSubmit(form)}>
						Generate Atlas →
					</Button>

					<div className='text-center text-xs text-foreground leading-relaxed border-t border-border pt-4'>
						Token requires{" "}
						<code className='bg-background text-indigo-500 px-1 py-0.5 rounded text-[11px]'>
							read:user
						</code>{" "}
						and{" "}
						<code className='bg-background text-purple-500 px-1 py-0.5 rounded text-[11px]'>
							read:followers
						</code>{" "}
						scopes.
						<div>
							<a
								href='https://github.com/settings/tokens'
								className='text-primary hover:underline mt-2'
								target='_blank'
								rel='noopener noreferrer'>
								Generate one →
							</a>
						</div>
						<p className='mt-2'>
							✓ Add{" "}
							<code className='bg-background text-blue-400 px-1 py-0.5 rounded text-[11px] mt-2'>
								user:follow
							</code>{" "}
							scope to unlock{" "}
							<code className='bg-background text-green-400 px-1 py-0.5 rounded text-[11px]'>
								Unfollow buttons
							</code>{" "}
							scopes.
						</p>
					</div>
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
