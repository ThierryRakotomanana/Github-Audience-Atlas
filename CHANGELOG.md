## 0.1.0

### Minor Changes

- Move to tailwind for styling and rewrite the loading and the header components [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`04cafb6`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/04cafb6789d062281f8edcb29b30ab6f3e657353)]

- feat(map): upgrade to ISO GeoJSON, add audience grouping, and optimize country list performance [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#4](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/4)]

- feat(panel): add search feature for both country list and profile list [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#10](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/10)]

- - Integrated `@shadcn/ui`, `tailwindcss`, and `lucide-react` into the project workspace. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`16c08a1`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/16c08a1e9b279c44f395dfe8ed6a5564eb1461c1)]
  - Added a "show/hide" toggle feature for user tokens to improve UX and security management.
  - Replaced custom/legacy UI views (Credentials, Loading, Error pages) with standardized, accessible native Shadcn components.

- fix path error for types and rewrite the error view in tailwind [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`5029c4d`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/5029c4d746945dd8d3c912b2a4beca9d26793aec)]

- feat: add location based user by parsing free-text and adding a dictionnary [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`15b8ad1`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/15b8ad15469cd5e7c0e3b419c5e8b7327c724df4)]
  - Implement a geocode method to parse, validate, and clean free-string location inputs.
  - Add text cleaning logic to tokenize location inputs into an array of search strings.
  - Create mapping dictionaries for city-to-country and flag-to-country resolution.
  - Sanitize inputs by filtering out English grammar prepositions (e.g., "in", "at") and excluding fantasy or virtual locations.
  - Return a filtered list of users based on the resolved country.

- Add local CI tooling: Husky, lint-staged, commitlint, and changesets [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`a75703a`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/a75703aa704293ce8871df541245a9aaa2a248fb)]

- ci: implement automated releases via Changesets and GitHub Actions [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#1](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/1)]

- refactor(panel): add meaningful informations for both country&profile list [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#9](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/9)]

- Added a responsive layout shell that scales automatically on window resize and handles container sizing safely on initial load. [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#3](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/3)]

- feat(map): colorize all countries uniquely and add canvas glow effects [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#5](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/5)]

- feat(map): display the audience by the selected category(followers, following, ghost) [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#7](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/7)]

- create a loader logic to visualize each steps of building the audience [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`4926ff6`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/4926ff6771308a809835a4b69599bfaabc71d87e)]

- refactor(map): extract fetching process to a custom hook, move hardcode styling by using tailwind and enhance accessibility [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#13](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/13)]

- Introduced an interactive SVG-based world map component to visualize geographic user distributions [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`77996dc`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/77996dc094cac807e9db40f793aa7e6b5267f4e0)]
  Updated project dependencies to include d3, d3-geo, and corresponding TypeScript definitions (@types/d3).

- Show a warning when the remaining quota of requests are less than needed(rate limit defined by Github API). [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`02337b4`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/02337b4cce1748ecda318e5bdc83e7aab60115f9)]

- Add a form for user's credentials [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`8f105a3`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/8f105a30fa53b31c31f024446e6b12b43a6b0940)]

### Patch Changes

- feat(locations): enforce strict matching and sanitize github user location : [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`3defcc0`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/3defcc04e114848c38f9ee2b70cb12f3f7779cb1)]
  - feat/fix: Enforce strict dictionary matching for cities and countries only.
  - fix: Parse user locations to strip out email patterns.
  - fix: Remove location acronym aliases to eliminate false positives.

- fix: remove deprecated ts config that leads to a failing ci & remove all unused component as they depend on unistalled dependencies(not listed in package-json or lock file) [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`325afcb`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/325afcb73c344c1df92f910c92f23e693032aa08)]

- feat: standardize UI with Shadcn and refactor hooks for release [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#15](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/15)]

- fix(map): glow effect to apply only on continent edges [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#8](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/8)]

- fix: wrapped input elemments inside a form element and avoid hydratation error that might be caused by a div wrapped inside a p element [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [`7c02f28`](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/commit/7c02f287e3ef20f5d360a3616ade3da02e3f3521)]

- fix(countrylist): correct null-selection state and clean up styling [made by [@ThierryRakotomanana](https://github.com/ThierryRakotomanana) full details in [#6](https://github.com/ThierryRakotomanana/Github-Audience-Atlas/pull/6)]
