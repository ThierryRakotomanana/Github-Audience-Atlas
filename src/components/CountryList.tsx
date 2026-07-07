import React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import type { AudienceData, LocalizedGithubProfile } from "@/types/api.types";

interface CountryListProps {
	data: AudienceData;
	title?: string;
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function CountryList({
	data,
	title = "Audience by Country"
}: CountryListProps) {
	const usersByCountry = new Map<string, LocalizedGithubProfile[]>();
	const { followers } = data;

	followers.map((user) => {
		let regionalUser = usersByCountry.get(user.country);
		if (!regionalUser) {
			regionalUser = [];
			usersByCountry.set(user.country, regionalUser);
		}
		regionalUser.push(user);
	});
	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-semibold tracking-tight text-foreground'>
					{title}
				</h3>
				<span className='text-xs text-muted-foreground font-mono'>
					{usersByCountry.size} regions
				</span>
			</div>

			<div className='flex-1 overflow-y-auto pr-2 scrollbar-thin [scrollbar-color:var(--color-border)_transparent]'>
				<div className='space-y-1'>
					{Array.from(usersByCountry.entries())
						.sort((a, b) => b[1].length - a[1].length)
						.map(([country, profiles]) => {
							const FlagComponent = (
								Flags as Record<string, React.ComponentType<{ className?: string }>>
							)[country.toUpperCase()];

							return (
								<div
									key={profiles[0].id}
									className='flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50'>
									<div className='flex items-center gap-3 min-w-0'>
										<div className='flex h-4 w-6 shrink-0 overflow-hidden rounded-sm border border-border/40 bg-muted object-cover shadow-xs'>
											{FlagComponent ?
												<FlagComponent className='h-full w-full object-cover' />
											:	<div className='h-full w-full bg-muted-foreground/20' />}
										</div>
										<span className='truncate font-medium text-foreground'>
											{regionNames.of(country)}
										</span>
									</div>
									<span className='font-mono text-xs font-semibold text-muted-foreground'>
										{profiles.length}
									</span>
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
}
