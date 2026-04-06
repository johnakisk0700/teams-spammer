import { z } from 'zod';

export const env = z
  .object({
    BITBUCKET_HOST: z.url(),
    BITBUCKET_API_TOKEN: z.string().min(1),
    TEAMS_TENANT_ID: z.string().min(1),
    TEAMS_CLIENT_ID: z.string().min(1),
    APPROVAL_THRESHOLD: z.coerce.number().int().min(1).default(3),
    QA_THRESHOLD: z.coerce.number().int().min(1).default(2),
    PORT: z.coerce.number().int().min(1).default(3000),
  })
  .parse(Bun.env);
