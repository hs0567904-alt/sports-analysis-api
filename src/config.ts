import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  SPORTMONKS_API_TOKEN: z.string().optional(),
  SPORTMONKS_BASE_URL: z.string().default("https://api.sportmonks.com/v3/football"),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().optional(),
  API_SECRET: z.string().min(1),
  CACHE_TTL_SECONDS: z.coerce.number().default(60)
});

export const env = envSchema.parse(process.env);
