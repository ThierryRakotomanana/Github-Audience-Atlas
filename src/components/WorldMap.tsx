import { getCountryColor, MAP_BASE_STYLING } from "@/lib/getCountryColor";
import type { LocalizedGithubProfile } from "@/types/api.types";
import * as d3 from "d3";
import type { Geometry } from "geojson";
import { useEffect, useMemo, useState } from "react";

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
	const [geoJson, setGeoJson] = useState<WorldGeoJson | null>(null);

	useEffect(() => {
		fetch(
			"https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson"
		)
			.then((response) => response.json())
			.then((data: WorldGeoJson) => {
				setGeoJson(data);
			})
			.catch((err) => console.error("Error loading map data:", err));
	}, []);

	const projection = useMemo(() => {
		return d3.geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
	}, [width, height]);

	const pathGenerator = useMemo(() => {
		return d3.geoPath().projection(projection);
	}, [projection]);

	const graticulePath = useMemo(() => {
		const graticule = d3.geoGraticule();
		return pathGenerator(graticule()) || "";
	}, [pathGenerator]);

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
			const regionalProfiles = acc.get(profile.country) || [];
			return acc.set(profile.country, regionalProfiles);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [audience]);

	if (!geoJson) {
		return (
			<div
				style={{
					width,
					height,
					display: "flex",
					alignItems: "center",
					justifyContent: "center"
				}}>
				<p>Loading global coordinates...</p>
			</div>
		);
	}

	return (
		<svg width={width} height={height} className='bg-[#030508]'>
			<g>
				<path d={pathGenerator({ type: "Sphere" }) as string} fill='#0B0F19'></path>
			</g>
			<g>
				<path
					d={graticulePath}
					fill='none'
					stroke='#bcc3d1'
					strokeWidth={0.05}></path>
			</g>
			<defs>
				<filter id='map-glow' x='-20%' y='-20%' width='140%' height='140%'>
					<feGaussianBlur stdDeviation='15' result='blur' />
					<feFlood flood-color='rgba(0, 255, 239, 0.25)' result='color' />
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
			<g filter='url(#map-glow)'>
				{mapPaths.map((country) => (
					<path
						key={`${country.id}-${country.name}`}
						d={country.svgPath}
						fill={
							profilesByCountry.get(country.id) ?
								`${getCountryColor(country.id)}`
							:	MAP_BASE_STYLING.defaultFill
						}
						stroke={MAP_BASE_STYLING.borderColor}
						strokeWidth={MAP_BASE_STYLING.borderWidth}
						style={{ transition: "all 0.2s ease" }}
						onMouseEnter={(e) => {
							(e.target as SVGPathElement).style.strokeWidth = "1.25";
						}}
						onMouseLeave={(e) => {
							(e.target as SVGPathElement).style.strokeWidth = String(
								MAP_BASE_STYLING.borderWidth
							);
						}}
						onClick={() => {
							setCountry(country.id);
						}}
					/>
				))}
			</g>
		</svg>
	);
};
