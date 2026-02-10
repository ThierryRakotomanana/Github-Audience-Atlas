import * as d3 from "d3";
import type { FeatureCollection, Geometry } from "geojson";
import * as topojson from "topojson-client";
import { useEffect, useMemo, useState } from "react";
import { geoGraticule } from "d3";

export interface CountryProperties {
	name: string;
}

export type WorldGeoJson = FeatureCollection<Geometry, CountryProperties>;

export interface WorldMapProps {
	width: number;
	height: number;
}

export const WorldMap = ({ width = 800, height = 450 }: WorldMapProps) => {
	const [geoJson, setGeoJson] = useState<WorldGeoJson | null>(null);

	useEffect(() => {
		fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
			.then((response) => response.json())
			.then((data) => {
				const convertedGeoJson = topojson.feature(
					data,
					data.objects.countries
				) as unknown as WorldGeoJson;
				setGeoJson(convertedGeoJson);
			})
			.catch((err) => console.error("Error loading map data:", err));
	}, []);

	const projection = d3.geoNaturalEarth1().fitSize([1000, 550], { type: "Sphere" });

	const pathGenerator = d3.geoPath().projection(projection);

	const mapPaths = useMemo(() => {
		if (!geoJson) return [];

		return geoJson.features.map((feature) => {
			return {
				id: feature.id || feature.properties.name,
				name: feature.properties.name,
				svgPath: pathGenerator(feature) || ""
			};
		});
	}, [geoJson, width, height]);

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
		<svg width={1000} height={550} className='bg-[#f0fdfa]'>
			<g>
				<path d={pathGenerator({ type: "Sphere" })!} fill='#6488bc'></path>
			</g>
			<g>
				<path
					d={pathGenerator(geoGraticule()())!}
					fill='none'
					stroke='#bcc3d1'
					strokeWidth={0.5}></path>
			</g>
			<g>
				{mapPaths.map((country) => (
					<path
						key={country.id}
						d={country.svgPath}
						fill='#2dd4bf'
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
							alert(`You clicked on: ${country.name}`);
						}}
					/>
				))}
			</g>
		</svg>
	);
};
