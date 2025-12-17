import { CDICT } from "../constant/lookupTables";
import type { GithubProfile } from "../types/api.types";

export const cleanLoc = (raw: string | null): string => {
	if (!raw) return "";
	let s = raw
		.replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, "")
		.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}]/gu, "");
	s = s.split(/[\\/|]/)[0];
	s = s.replace(/\(.*?\)/g, "");
	s = s.replace(
		/\b(remote|currently|based in|living in|from|near|@|formerly|ex-)\b/gi,
		""
	);
	return s.trim().toLowerCase().replace(/\s+/g, " ");
};

export const guessCountry = (location: string) => {
	if (CDICT[location as keyof typeof CDICT])
		return CDICT[location as keyof typeof CDICT];
	for (const [key, value] of Object.entries(CDICT)) {
		if (location.includes(key)) return value;
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
