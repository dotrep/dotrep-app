import { z } from "zod";

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development","production","test"]).default("development"),
  DATABASE_URL: z.string().min(1).optional(),     // required in prod by app logic
  VITE_API_URL: z.string().optional()             // optional if using proxy
});

export type Env = z.infer<typeof EnvSchema>;
export const parseEnv = (e: Record<string, string | undefined>) => EnvSchema.parse(e);
