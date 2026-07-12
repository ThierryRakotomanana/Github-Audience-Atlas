# 🗺️ GitHub Audience Map

Visualize your GitHub network on a global scale. This tool generates an interactive world map to show the geographic distribution of your followers, the people you follow, and the "ghosts" in your network.


<img alt="GitHub Audience Map Preview" width="1200" height="600" alt="Screenshot from 2026-07-12 19-02-23" src="https://github.com/user-attachments/assets/e326df02-47ee-470d-977d-694c95fac066" />

## Features

Currently in **v1**, the map visualizes three distinct network categories:

- **Followers:** See the geographic distribution of developers who follow your work.
- **Following:** See where the people you are learning from and following are located.
- **Ghosts:** Identify non-reciprocal relationships — the developers you follow who don't follow you back.

## Getting Started

### Prerequisites

To use this tool, you need a GitHub Personal Access Token (PAT).

1. Go to your GitHub **Settings** > **Developer Settings** > **Personal access tokens**.
2. Generate a new token with the following scopes:
      - `read:user`
      - `user:read` (to access profile and follower data)

### Usage

1. Launch the application.
2. Enter your GitHub username.
3. Paste your Personal Access Token.
4. Generate your map!

## Roadmap (Upcoming Features)

This is just the first version. The following features are planned for upcoming releases:

- [ ] **Direct Unfollow:** Ability to unfollow "ghosts" directly from the interface (will require the `user:follow` token scope).
- [ ] **Unmapped Users Category:** A dedicated list/view for users who do not have location data on their GitHub profiles.
- [ ] **Advanced Color Modes:** New map rendering styles, including a heatmap, radar view, and a "GitHub Contribution Green" mode.
- [ ] **UI/UX Overhaul:** Continuous improvements to the interface and user flow.

## Connect & Follow

If you find this project interesting, **follow me on GitHub!** I am consistently building and sharing more cool projects, web tools, and open-source contributions.

[ThierryRakotomanana](https://github.com/ThierryRakotomanana)
