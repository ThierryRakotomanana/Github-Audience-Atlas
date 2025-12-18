import { CDICT } from "../constants/lookupTables";
import type { GithubProfile } from "../types/api.types";

export const cleanLoc = (raw: string | null): string[] => {
	if (!raw) return [];
	const parts = raw.split(new RegExp("[()/|\\s]+"));
	const pieces: string[] = [];
	for (let chunk of parts) {
		chunk = chunk.replace(
			/\b(remote|currently|based in|living in|from|near|@|formerly|ex-)\b/gi,
			""
		);
		chunk = chunk.replace(/[^a-zA-Z\p{L}\u{1F1E6}-\u{1F1FF}]/gu, "");
		chunk = chunk.replace(
			/(?<![\u{1F1E6}-\u{1F1FF}])[\u{1F1E6}-\u{1F1FF}](?![\u{1F1E6}-\u{1F1FF}])/gu,
			""
		);
		const cleaned = chunk.trim().toLowerCase();
		if (cleaned) {
			pieces.push(cleaned);
		}
	}

	if (pieces.length === 0) return [];

	const fullConcatenated = pieces.join(" ");
	return [fullConcatenated, ...pieces];
};

export const guessCountry = (locations: string[]) => {
	for (let index = 0; index < locations.length; index++) {
		const location = locations[index];
		for (const [key, value] of Object.entries(CDICT)) {
			if (location.includes(key)) return value;
		}
	}
};

export function geocode(rawData: GithubProfile[]) {
	const pcMap = new Map();
	for (const profile of rawData) {
		const clean = cleanLoc(profile.location);
		const country = guessCountry(clean);
		if (!country) continue;
		pcMap.set(profile.login, country);
	}
	return pcMap;
}
