import { useMemo } from "react";
import { X } from "lucide-react";
import type { AudienceData, LocalizedGithubProfile } from "@/types/api.types";
import { CountryFlag } from "@/components/CountryFlag";
import { getRegionName } from "@/lib/region";

interface CountryListProps {
	data: AudienceData;
	title?: string;
	country: string | null;
	setCountry: (arg: string | null) => void;
}

export function CountryList({
	data,
	title = "Audience by Country",
	country,
	setCountry
}: CountryListProps) {
	const usersByCountry = useMemo(() => {
		return data.followers.reduce((acc, user) => {
			const regionalUsers = acc.get(user.country) || [];
			regionalUsers.push(user);
			return acc.set(user.country, regionalUsers);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [data.followers]);

	const sortedCountries = useMemo(() => {
		return Array.from(usersByCountry.entries()).sort(
			(a, b) => b[1].length - a[1].length
		);
	}, [usersByCountry]);

	const selectedProfiles = country ? (usersByCountry.get(country) ?? []) : null;

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex items-center justify-between gap-2'>
				{country ?
					<button
						type='button'
						onClick={() => setCountry(null)}
						className='inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-2 pr-1 text-sm font-medium text-foreground transition-colors hover:bg-muted'>
						<CountryFlag
							isoCode={country}
							className='h-3.5 w-5 shrink-0 rounded-sm'
						/>
						<span className='truncate'>{getRegionName(country)}</span>
						<span className='flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground'>
							<X size={12} />
						</span>
					</button>
				:	<h3 className='text-sm font-semibold tracking-tight text-foreground'>
						{title}
					</h3>
				}
				<span className='shrink-0 font-mono text-xs text-muted-foreground'>
					{country ? usersByCountry.get(country)?.length : usersByCountry.size}
				</span>
			</div>

			<div className='scrollbar-thin flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--color-border)_transparent]'>
				{selectedProfiles === null && (
					<div className='space-y-1'>
						{sortedCountries.map(([code, profiles]) => (
							<div
								key={code}
								role='button'
								tabIndex={0}
								onClick={() => setCountry(code)}
								onKeyDown={(e) => e.key === "Enter" && setCountry(code)}
								className='flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/50'>
								<div className='flex min-w-0 items-center gap-3'>
									<CountryFlag
										isoCode={code}
										className='h-4 w-6 shrink-0 rounded-sm border border-border/40'
									/>
									<span className='truncate font-medium text-foreground'>
										{getRegionName(code)}
									</span>
								</div>
								<span className='font-mono text-xs font-semibold text-muted-foreground'>
									{profiles.length}
								</span>
							</div>
						))}
					</div>
				)}

				{selectedProfiles !== null && (
					<div className='space-y-1'>
						{selectedProfiles.length > 0 ?
							selectedProfiles.map((profile) => (
								<div
									key={profile.id}
									className='flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50'>
									<div className='flex min-w-0 items-center justify-evenly gap-3'>
										<img
											src={profile.avatar_url}
											alt={profile.login}
											className='h-9 w-9 shrink-0 rounded-full border border-border'
										/>
										<a href={profile.html_url} target='_blank'>
											<span className='truncate font-medium text-foreground'>
												{profile.name}
											</span>
										</a>
									</div>
								</div>
							))
						:	<p className='px-3 py-6 text-center text-sm text-muted-foreground'>
								No followers from this region yet.
							</p>
						}
					</div>
				)}
			</div>
		</div>
	);
}
