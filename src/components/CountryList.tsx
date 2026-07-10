import { useMemo } from "react";
import { Globe2, X } from "lucide-react";
import type { LocalizedGithubProfile } from "@/types/api.types";
import { CountryFlag } from "@/components/CountryFlag";
import { getRegionName, UNKNOWN_REGION } from "@/lib/region";
import { Badge } from "@/components/ui/badge";
import { getCountryColor } from "@/lib/getCountryColor";
import { cn } from "@/lib/utils";

interface CountryListProps {
	data: LocalizedGithubProfile[];
	country: string | null;
	setCountry: (arg: string | null) => void;
}

function RegionIcon({ code, className }: { code: string; className?: string }) {
	if (code === UNKNOWN_REGION) {
		return (
			<span
				className={cn(
					"flex items-center justify-center bg-muted text-muted-foreground",
					className
				)}>
				<Globe2 className='h-3 w-3' />
			</span>
		);
	}
	return <CountryFlag isoCode={code} className={className} />;
}

export function CountryList({ data, country, setCountry }: CountryListProps) {
	const usersByCountry = useMemo(() => {
		return data.reduce((acc, user) => {
			const regionalUsers = acc.get(user.country) || [];
			regionalUsers.push(user);
			return acc.set(user.country, regionalUsers);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [data]);

	const sortedCountries = useMemo(() => {
		return Array.from(usersByCountry.entries()).sort(
			(a, b) => b[1].length - a[1].length
		);
	}, [usersByCountry]);

	const maxCount = useMemo(
		() => Math.max(1, ...sortedCountries.map(([, profiles]) => profiles.length)),
		[sortedCountries]
	);

	const totalFollowers = data.length;

	const selectedProfiles = country ? (usersByCountry.get(country) ?? []) : null;

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex items-center justify-between gap-2'>
				{country ?
					<div
						className={`flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2`}
						style={{ background: `${getCountryColor(country)}20` }}>
						<CountryFlag
							isoCode={country}
							className='h-5 w-7 shrink-0 rounded-sm border border-border/40'
						/>
						<div className='min-w-0'>
							<button
								type='button'
								onClick={() => setCountry(null)}
								className='inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-2 pr-1 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted'>
								<span className='truncate'>{getRegionName(country)}</span>
								<span className='flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground'>
									<X size={12} />
								</span>
							</button>
							<Badge
								variant='outline'
								className='shrink-0 font-mono text-xs font-normal bg-muted/40 text-foreground/60'>
								{country ?
									`${selectedProfiles?.length ?? 0} followers`
								:	`${sortedCountries.length} regions`}
							</Badge>
						</div>
					</div>
				:	<Badge
						variant='outline'
						className='shrink-0 font-mono text-xs font-normal bg-muted/40 text-foreground/60'>
						{sortedCountries.length} country
					</Badge>
				}
			</div>

			<div className='scrollbar-thin flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--color-border)_transparent]'>
				{selectedProfiles === null && (
					<div className='space-y-1'>
						{sortedCountries.map(([code, profiles]) => (
							<button
								key={code}
								type='button'
								onClick={() => setCountry(code)}
								className='group relative flex w-full items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50'>
								<span
									aria-hidden
									className='absolute inset-y-0 left-0 bg-primary/10 transition-all group-hover:bg-primary/15'
									style={{ width: `${(profiles.length / maxCount) * 100}%` }}
								/>
								<span className='relative z-10 flex min-w-0 items-center gap-3'>
									<RegionIcon
										code={code}
										className='h-4 w-6 shrink-0 rounded-sm border border-border/40'
									/>
									<span className='flex min-w-0 flex-col'>
										<span className='truncate font-medium text-foreground'>
											{getRegionName(code)}
										</span>
										<span className='text-xs text-muted-foreground'>
											{Math.round((profiles.length / totalFollowers) * 100)}%
										</span>
									</span>
								</span>
								<Badge
									variant='secondary'
									className='relative z-10 shrink-0 font-mono text-xs'>
									{profiles.length}
								</Badge>
							</button>
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
