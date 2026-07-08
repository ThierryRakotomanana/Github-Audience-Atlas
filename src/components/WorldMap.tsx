import type { AudienceData, LocalizedGithubProfile } from "@/types/api.types";
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
	audience: AudienceData;
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
		return audience.followers.reduce((acc, profile) => {
			const regionalProfiles = acc.get(profile.country) || [];
			return acc.set(profile.country, regionalProfiles);
		}, new Map<string, LocalizedGithubProfile[]>());
	}, [audience.followers]);

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
		<svg width={width} height={height} className='bg-[#f0fdfa]'>
			<g>
				<path d={pathGenerator({ type: "Sphere" }) as string} fill='#6488bc'></path>
			</g>
			<g>
				<path
					d={graticulePath}
					fill='none'
					stroke='#bcc3d1'
					strokeWidth={0.5}></path>
			</g>
			<g>
				{mapPaths.map((country) => (
					<path
						key={`${country.id}-${country.name}`}
						d={country.svgPath}
						fill={profilesByCountry.get(country.id) ? "#2dd4bf" : "#ffffff"}
						stroke='#ffffff'
						strokeWidth={0.5}
						style={{ transition: "all 0.2s ease" }}
						onMouseEnter={(e) => {
							(e.target as SVGPathElement).style.fill = "#0d9488"; // Darker teal on hover
						}}
						onMouseLeave={(e) => {
							(e.target as SVGPathElement).style.fill = "#2dd4bf";
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
