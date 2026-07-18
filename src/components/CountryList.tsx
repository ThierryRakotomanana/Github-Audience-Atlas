import { useMemo, useState } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import { CountryFlag } from "@/components/CountryFlag";
import { getRegionName, UNKNOWN_REGION } from "@/lib/region";
import { Badge } from "@/components/ui/badge";
import { getCountryColor } from "@/lib/getCountryColor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RegionIcon } from "@/components/RegionIcon.Panel";
import { EmptyState } from "@/components/EmptyState.Panel";
import type { LocalizedGithubProfile } from "@/api/graphql.types";

interface CountryListProps {
	data: LocalizedGithubProfile[];
	country: string | null;
	setCountry: (arg: string | null) => void;
}

const EMPTY_PROFILES: LocalizedGithubProfile[] = [];

export function CountryList({ data, country, setCountry }: CountryListProps) {
	const [search, setSearch] = useState("");
	const [prevCountry, setPrevCountry] = useState(country);

	if (country !== prevCountry) {
		setPrevCountry(country);
		setSearch("");
	}

	const totalFollowers = data.length;

	const usersByCountry = useMemo(() => {
		return data.reduce((acc, user) => {
			const code = user.country || UNKNOWN_REGION;
			const regionalUsers = acc.get(code) || [];
			regionalUsers.push(user);
			return acc.set(code, regionalUsers);
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

	const unknownCount = usersByCountry.get(UNKNOWN_REGION)?.length ?? 0;

	const filteredCountries = useMemo(() => {
		if (!search.trim()) return sortedCountries;
		const q = search.trim().toLowerCase();
		return sortedCountries.filter(([code]) =>
			getRegionName(code).toLowerCase().includes(q)
		);
	}, [sortedCountries, search]);

	const selectedProfiles = useMemo(
		() => (country ? (usersByCountry.get(country) ?? EMPTY_PROFILES) : null),
		[country, usersByCountry]
	);

	const filteredProfiles = useMemo(() => {
		if (!selectedProfiles) return EMPTY_PROFILES;
		if (!search.trim()) return selectedProfiles;
		const q = search.trim().toLowerCase();
		return selectedProfiles.filter(
			(p) =>
				(p.name ?? "").toLowerCase().includes(q)
				|| p.login.toLowerCase().includes(q)
		);
	}, [selectedProfiles, search]);

	const searchLabel = country ? "Search followers" : "Search countries";

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex items-center justify-between gap-2'>
				{country ?
					<div
						className='flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2'
						style={{ background: `${getCountryColor(country)}20` }}>
						<CountryFlag
							isoCode={country}
							className='h-5 w-7 shrink-0 rounded-sm border border-border/40'
						/>
						<div className='min-w-0'>
							<button
								type='button'
								onClick={() => setCountry(null)}
								className='inline-flex min-w-0 items-center gap-2 rounded-full border border-border bg-muted/40 py-1 pl-2 pr-1 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'>
								<span className='truncate'>{getRegionName(country)}</span>
								<span className='flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground'>
									<X size={12} />
								</span>
							</button>
							<Badge
								variant='outline'
								className='shrink-0 font-mono text-xs font-normal bg-muted/40 text-muted-foreground'>
								{country ?
									`${selectedProfiles?.length ?? 0} followers`
								:	`${sortedCountries.length} regions`}
							</Badge>
						</div>
					</div>
				:	<Badge
						variant='outline'
						className='shrink-0 font-mono text-xs font-normal bg-muted/40 text-muted-foreground'>
						{sortedCountries.length} country
					</Badge>
				}
			</div>

			<div className='relative'>
				<Search className='pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
				<label htmlFor='country-list-search' className='sr-only'>
					{searchLabel}
				</label>
				<Input
					id='country-list-search'
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder={`${searchLabel}…`}
					className='h-8 pl-8 text-sm'
				/>
			</div>

			<div className='scrollbar-thin flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--color-border)_transparent]'>
				{selectedProfiles === null ?
					filteredCountries.length > 0 ?
						<div className='space-y-1'>
							{filteredCountries.map(([code, profiles]) => (
								<button
									key={code}
									type='button'
									onClick={() => setCountry(code)}
									className='group relative flex w-full items-center justify-between overflow-hidden rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'>
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
					:	<EmptyState text={`No countries match "${search}"`} />
				: filteredProfiles.length > 0 ?
					<div className='space-y-1'>
						{filteredProfiles.map((profile) => (
							<a
								key={profile.id}
								href={profile.url}
								target='_blank'
								rel='noreferrer'
								className='group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'>
								<span className='flex min-w-0 items-center gap-3'>
									<Avatar className='h-9 w-9 border border-border'>
										<AvatarImage src={profile.avatarUrl} alt={profile.login} />
										<AvatarFallback className='text-xs'>
											{(profile.name ?? profile.login).slice(0, 2).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className='flex min-w-0 flex-col'>
										<span className='truncate font-medium text-foreground'>
											{profile.name ?? profile.login}
										</span>
										<span className='truncate font-mono text-xs text-muted-foreground'>
											@{profile.login}
										</span>
									</span>
								</span>
								<ExternalLink className='h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100' />
							</a>
						))}
					</div>
				: selectedProfiles && selectedProfiles.length === 0 ?
					<EmptyState text='No followers from this region yet.' />
				:	<EmptyState text={`No followers match "${search}"`} />}
			</div>
			{!country && unknownCount > 0 && (
				<>
					<Separator />
					<p className='px-1 text-xs text-muted-foreground'>
						{unknownCount} follower{unknownCount > 1 ? "s" : ""} without a public
						location aren't shown on the map.
					</p>
				</>
			)}
		</div>
	);
}
