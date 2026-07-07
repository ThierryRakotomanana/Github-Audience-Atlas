import React, { useMemo } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import type { AudienceData, LocalizedGithubProfile } from "@/types/api.types";

interface CountryListProps {
	data: AudienceData;
	title?: string;
	country: string | null;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

function getSafeRegionName(code: string): string {
	try {
		return regionNames.of(code) || code;
	} catch {
		return code;
	}
}

export function CountryList({
	data,
	title = "Audience by Country",
	country
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

	const selectedProfiles = country ? usersByCountry.get(country) : undefined;

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-semibold tracking-tight text-foreground'>
					{title}
				</h3>
				<span className='font-mono text-xs text-muted-foreground'>
					{usersByCountry.size} regions
				</span>
			</div>

			<div className='scrollbar-thin flex-1 overflow-y-auto pr-2 [scrollbar-color:var(--color-border)_transparent]'>
				<div className='space-y-1'>
					{!selectedProfiles
						&& sortedCountries.map(([countryCode, profiles]) => {
							const FlagComponent = (
								Flags as Record<string, React.ComponentType<{ className?: string }>>
							)[countryCode.toUpperCase()];

							return (
								<div
									key={countryCode}
									className='flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50'>
									<div className='flex min-w-0 items-center gap-3'>
										<div className='shadow-xs flex h-4 w-6 shrink-0 overflow-hidden rounded-sm border border-border/40 bg-muted object-cover'>
											{FlagComponent ?
												<FlagComponent className='h-full w-full object-cover' />
											:	<div className='h-full w-full bg-muted-foreground/20' />}
										</div>
										<span className='truncate font-medium text-foreground'>
											{getSafeRegionName(countryCode)}
										</span>
									</div>
									<span className='font-mono text-xs font-semibold text-muted-foreground'>
										{profiles.length}
									</span>
								</div>
							);
						})}
				</div>

				{selectedProfiles && selectedProfiles.length > 0 && (
					<>
						<hr className='my-4 border-border' />
						<div className='space-y-1'>
							<h4 className='mb-2 px-3 text-xs font-medium text-muted-foreground'>
								Profiles in {getSafeRegionName(country!)}{" "}
							</h4>
							{selectedProfiles.map((profile) => (
								<div
									key={profile.id}
									className='flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50'>
									<div className='flex min-w-0 items-center gap-3'>
										<div className='shadow-xs flex h-9 w-9 items-center justify-center shrink-0 overflow-hidden rounded-sm border border-border/40 bg-muted object-cover text-[10px] font-mono'>
											<img
												src={profile.avatar_url}
												alt={profile.login}
												className='w-9 h-9 rounded-full border border-border shrink-0'
											/>
										</div>
										<span className='truncate font-medium text-foreground'>
											{profile.name}
										</span>
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
