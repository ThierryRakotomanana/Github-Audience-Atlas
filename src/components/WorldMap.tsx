import { useGeoJson } from "@/hooks/useGeoJson";
import { MAP_BASE_STYLING } from "@/lib/getCountryColor";
import type { LocalizedGithubProfile } from "@/types/api.types";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { scaleLog } from "d3";
import type { Geometry } from "geojson";
import { useMemo } from "react";

interface GeoProperties {
	NAME_EN: string;
	ISO_A2_EH: string;
}

interface CountryFeature {
	type: "Feature";
	properties: GeoProperties;
	geometry: Geometry;
}

interface WorldGeoJson {
	type: "FeatureCollection";
	features: CountryFeature[];
}

export interface WorldMapProps {
	width: number;
	height: number;
	setCountry: (country: string) => void;
	audience: LocalizedGithubProfile[];
}

export const WorldMap = ({
	width,
	height,
	setCountry,
	audience
}: WorldMapProps) => {
	const url =
		"https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson";

	const {
		data: geoJson,
		isLoading,
		error: loadError,
		retry: setReloadKey
	} = useGeoJson<WorldGeoJson>(url);

	const projection = useMemo(() => {
		return geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
	}, [width, height]);

	const pathGenerator = useMemo(() => {
		return geoPath().projection(projection);
	}, [projection]);

	const mapPaths = useMemo(() => {
		if (!geoJson) return [];

		return geoJson.features.map((feature) => {
			return {
				id: feature.properties.ISO_A2_EH,
				name: feature.properties.NAME_EN,
				svgPath: pathGenerator(feature) || ""
			};
		});
	}, [geoJson, pathGenerator]);

	const profilesByCountry = useMemo(() => {
		return audience.reduce((acc, profile) => {
			const regionalProfiles = acc.get(profile.country) ?? [];
			regionalProfiles.push(profile);
			return acc.set(profile.country, regionalProfiles);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [audience]);

	const maxCount = useMemo(
		() =>
			Math.max(0, ...Array.from(profilesByCountry.values()).map((p) => p.length)),
		[profilesByCountry]
	);
	const heatScale = useMemo(() => {
		const domainMax = Math.max(1, maxCount);
		return scaleLog()
			.domain([1, domainMax + 1])
			.range([0.22, 0.95])
			.clamp(true);
	}, [maxCount]);

	if (loadError) {
		return (
			<div
				style={{ width, height }}
				className='flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground'>
				<p>Couldn't load the world map.</p>
				<button
					type='button'
					onClick={setReloadKey}
					className='rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'>
					Retry
				</button>
			</div>
		);
	}

	if (isLoading || !geoJson) {
		return (
			<div
				style={{ width, height }}
				className='flex items-center justify-center text-sm text-muted-foreground'>
				<p className='animate-pulse'>Loading global coordinates…</p>
			</div>
		);
	}

	return (
		<svg width={width} height={height} className='bg-(--atlas-sphere)'>
			<g>
				<path
					d={pathGenerator({ type: "Sphere" }) as string}
					fill='var(--map-water)'
				/>
			</g>
			<defs>
				<filter id='map-glow' x='-10%' y='-10%' width='110%' height='110%'>
					<feGaussianBlur stdDeviation='15' result='blur' />
					<feFlood floodColor='var(--primary)' floodOpacity='0.15' result='color' />
					<feComposite in='color' in2='blur' operator='in' result='coloredGlow' />
					<feComposite
						in='coloredGlow'
						in2='SourceAlpha'
						operator='out'
						result='hollowGlow'
					/>
					<feMerge>
						<feMergeNode in='hollowGlow' />
						<feMergeNode in='SourceGraphic' />
					</feMerge>
				</filter>
			</defs>
			<g filter=''>
				{mapPaths.map((country) => {
					const count = profilesByCountry.get(country.id)?.length ?? 0;
					const hasData = count > 0;
					return (
						<path
							key={`${country.id}-${country.name}`}
							d={country.svgPath}
							fill={
								hasData ?
									`hsl(var(--signal) / ${heatScale(count).toFixed(2)})`
								:	MAP_BASE_STYLING.defaultFill
							}
							className='transition-colors duration-300 ease-in-out cursor-pointer stroke-[0.05px] stroke-accent-foreground hover:stroke-[1.5px] hover:stroke-accent-foreground hover:brightness-110 focus:outline-none focus-visible:stroke-[2.5px] focus-visible:stroke-ring'
							tabIndex={0}
							role='button'
							aria-label={`${country.name}${profilesByCountry.get(country.id) ? `, ${profilesByCountry.get(country.id)!.length} follower${profilesByCountry.get(country.id)!.length > 1 ? "s" : ""}` : ", no followers"}`}
							onClick={() => {
								setCountry(country.id);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									setCountry(country.id);
								}
							}}
						/>
					);
				})}
			</g>
		</svg>
	);
};
