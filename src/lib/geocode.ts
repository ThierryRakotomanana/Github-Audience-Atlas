import { delay } from "../api/github";
import { CN, countryCodesSet } from "../constants/countries";
import { CDICT } from "../constants/lookupTables";
import { SKIP } from "../constants/unlocated";
import type { GithubProfile } from "../types/api.types";

const NOISE_WORDS =
	/\b(remote|currently|based in|living in|from|near|@|formerly|ex-)\b/gi;
const NON_LETTER = /[^a-zA-Z\p{L}\u{1F1E6}-\u{1F1FF}]/gu;
const LONE_FLAG =
	/(?<![\u{1F1E6}-\u{1F1FF}])[\u{1F1E6}-\u{1F1FF}](?![\u{1F1E6}-\u{1F1FF}])/gu;

export const cleanLoc = (raw: string | null): string[] => {
	if (!raw) return [];
	const parts = raw.split(new RegExp("[()/|\\s]+"));
	const pieces: string[] = [];
	for (let chunk of parts) {
		chunk = chunk.replace(NOISE_WORDS, "");
		chunk = chunk.replace(NON_LETTER, "");
		chunk = chunk.replace(LONE_FLAG, "");
		const cleaned = chunk.trim().toLowerCase();
		if (cleaned) {
			pieces.push(cleaned);
		}
	}

	if (pieces.length === 0) return [];

	return pieces.length === 1 ? [...pieces] : [pieces.join(" "), ...pieces];
};

export const guessCountry = (locations: string[]) => {
	if (locations.length === 0) return null;
	for (const [code, country] of Object.entries(CN)) {
		const containCountry = locations[0].includes(country.toLowerCase());
		if (containCountry) return code;
	}

	for (let index = 0; index < locations.length; index++) {
		const location = locations[index];
		if (SKIP.has(location)) return "SKIP";
	}

	for (let index = 0; index < locations.length; index++) {
		const location = locations[index];
		if (countryCodesSet.has(location.toUpperCase())) return location;
		for (const [city, country] of Object.entries(CDICT)) {
			if (city.includes(location)) return country;
		}
	}
	return null;
};

export async function geocode(
	rawData: GithubProfile[],
	onProgress: ({ done, total }: { done: number; total: number }) => void
) {
	const pcMap = new Map();
	const needLoc = new Map();
	const skipped = new Map();
	console.log(rawData.length);
	let i = 0;
	for (const profile of rawData) {
		const clean = cleanLoc(profile.location);
		console.log(clean);
		onProgress({ done: pcMap.size, total: rawData.length });
		const country = guessCountry(clean);
		console.log(country, i++);
		if (!country) {
			needLoc.set(profile.location, profile);
			continue;
		}

		if (country == "SKIP") {
			skipped.set(profile.location, profile);
			continue;
		}

		pcMap.set(profile.login, { ...profile, location: country });
	}
	await delay(550);
	console.log(pcMap.size + needLoc.size + skipped.size);
	return { pcMap, needLoc, skipped };
}
