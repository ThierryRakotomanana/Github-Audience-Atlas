import { delay } from "../api/github";
import { ALIASES } from "../constants/aliases";
import { CN, countryCodesSet } from "../constants/countries";
import { CDICT } from "../constants/lookupTables";
import { SKIP } from "../constants/unlocated";
import type { GithubProfile } from "../types/api.types";

const NOISE_WORDS =
	/\b(remote|currently|based in|living in|from|near|@|formerly|ex-)\b/gi;
const NON_LETTER = /[^a-zA-Z\p{L}\u{1F1E6}-\u{1F1FF}]/gu;
const LONE_FLAG =
	/(?<![\u{1F1E6}-\u{1F1FF}])[\u{1F1E6}-\u{1F1FF}](?![\u{1F1E6}-\u{1F1FF}])/gu;
const DELIMITER =
	/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|[()|/\s\-_.,;:!?@#&[\]{}<>*+=%^~$`"\\]+/;

const normalise = (s: string): string => s.normalize("NFD").replace(/\p{Mn}/gu, "");

export const cleanLoc = (raw: string | null): string[] => {
	if (!raw?.trim()) return [];

	const pieces = raw
		.split(DELIMITER)
		.map((chunk) =>
			normalise(
				chunk
					.replace(NOISE_WORDS, "")
					.replace(NON_LETTER, "")
					.replace(LONE_FLAG, "")
					.trim()
					.toLowerCase()
			)
		)
		.filter(Boolean);

	if (pieces.length === 0) return [];
	if (pieces.length === 1) return pieces;

	const ngrams: string[] = [];
	for (let len = pieces.length; len >= 1; len--) {
		for (let start = 0; start <= pieces.length - len; start++) {
			ngrams.push(pieces.slice(start, start + len).join(" "));
		}
	}
	return [...new Set(ngrams)];
};

export const guessCountry = (locations: string[]) => {
	if (locations.length === 0) return null;
	const full = locations[0];

	if (ALIASES[full]) return ALIASES[full];

	for (const token of locations) {
		const country = CN[token as keyof typeof CN];
		if (country) return country;
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
