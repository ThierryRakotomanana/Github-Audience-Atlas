import React from "react";
import * as Flags from "country-flag-icons/react/3x2";

export interface CountryMetric {
	code: string;
	name: string;
	value: number | string;
}

interface CountryListProps {
	data: CountryMetric[];
	title?: string;
}

export function CountryList({
	data,
	title = "Audience by Country"
}: CountryListProps) {
	return (
		<div className='flex h-full flex-col gap-4'>
			{/* Sidebar Section Header */}
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-semibold tracking-tight text-foreground'>
					{title}
				</h3>
				<span className='text-xs text-muted-foreground font-mono'>
					{data.length} regions
				</span>
			</div>

			{/* Scrollable Container */}
			<div className='flex-1 overflow-y-auto pr-2 scrollbar-thin [scrollbar-color:var(--color-border)_transparent]'>
				<div className='space-y-1'>
					{data.map((country) => {
						// Dynamically resolve flag component based on ISO code
						const FlagComponent = (
							Flags as Record<string, React.ComponentType<{ className?: string }>>
						)[country.code.toUpperCase()];

						return (
							<div
								key={country.code}
								className='flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50'>
								<div className='flex items-center gap-3 min-w-0'>
									<div className='flex h-4 w-6 shrink-0 overflow-hidden rounded-sm border border-border/40 bg-muted object-cover shadow-xs'>
										{FlagComponent ?
											<FlagComponent className='h-full w-full object-cover' />
										:	<div className='h-full w-full bg-muted-foreground/20' />}
									</div>
									<span className='truncate font-medium text-foreground'>
										{country.name}
									</span>
								</div>
								<span className='font-mono text-xs font-semibold text-muted-foreground'>
									{country.value}
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
