---
"audience-atlas": patch
---

feat(locations): enforce strict matching and sanitize github user location :

- feat/fix: Enforce strict dictionary matching for cities and countries only.
- fix: Parse user locations to strip out email patterns.
- fix: Remove location acronym aliases to eliminate false positives.
