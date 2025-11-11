import z from "zod";

export const userLocationSchema = z.string()
export const GitHubUserSchema = z.object({
  login:               z.string(),
  id:                  z.number(),
  node_id:             z.string(),
  avatar_url:          z.url(),
  gravatar_id:         z.string(),
  url:                 z.url(),
  html_url:            z.url(),
  followers_url:       z.url(),
  following_url:       z.url(),
  gists_url:           z.url(),
  starred_url:         z.url(),
  subscriptions_url:   z.url(),
  organizations_url:   z.url(),
  repos_url:           z.url(),
  events_url:          z.url(),
  received_events_url: z.url(),
  type:                z.enum(['User', 'Organization', 'Bot']),
  user_view_type:      z.string(),
  site_admin:          z.boolean(),
});

export type GitHubUser = z.infer< typeof GitHubUserSchema>
export type GithubLocation = z.infer<typeof userLocationSchema>
