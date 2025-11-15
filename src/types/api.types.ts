import z from 'zod';

//Need a Flexible Url parser as some urls included characeters '{ }' that will failed zod url validation
const URITemplateSchema = z.string().includes('{').includes('}');
const FlexibleUrlSchema = z.union([z.url(), URITemplateSchema]);

export const LocationSchema = z.string().nullable();

export const GithubUserSchema = z
  .object({
    login: z.string(),
    id: z.number(),
    node_id: z.string(),
    avatar_url: z.url(),
    gravatar_id: z.string(),
    url: z.url(),
    html_url: z.url(),
    followers_url: z.url(),
    following_url: FlexibleUrlSchema,
  })
  .loose();

export const GithubProfileSchema = z.union([
  GithubUserSchema,
  z
    .object({
      gists_url: FlexibleUrlSchema,
      starred_url: FlexibleUrlSchema,
      subscriptions_url: z.url(),
      organizations_url: z.url(),
      repos_url: z.url(),
      events_url: FlexibleUrlSchema,
      received_events_url: z.url(),
      type: z.enum(['User', 'Organization', 'Bot']),
      user_view_type: z.string(),
      site_admin: z.boolean(),
      name: z.string().nullable(),
      twitter_username: z.string().nullable(),
      company: z.string().nullable(),
      location: z.string().nullable(),
      followers: z.number(),
      following: z.number(),
    })
    .loose(),
]);

export type GithubUser = z.infer<typeof GithubUserSchema>;
export type GithubProfile = z.infer<typeof GithubProfileSchema>;
export type GithubLocation = z.infer<typeof LocationSchema>;

export type AudienceType = 'followers' | 'following';
