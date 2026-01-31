---
"audience-atlas": minor
---

feat: add location based user by parsing free-text and adding a dictionnary

- Implement a geocode method to parse, validate, and clean free-string location inputs.
- Add text cleaning logic to tokenize location inputs into an array of search strings.
- Create mapping dictionaries for city-to-country and flag-to-country resolution.
- Sanitize inputs by filtering out English grammar prepositions (e.g., "in", "at") and excluding fantasy or virtual locations.
- Return a filtered list of users based on the resolved country.
