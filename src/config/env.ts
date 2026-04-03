import { z } from "zod";

export const env = z
  .object({
    BITBUCKET_HOST: z.url(),
    BITBUCKET_API_TOKEN: z.string().min(1),
  })
  .parse(Bun.env);
