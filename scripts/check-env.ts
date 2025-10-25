import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required for database connection"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters for security"),
  
  PORT: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
  
  ADMIN_WALLETS: z.string().optional(),
  
  DASHBOARD_PHASE0: z.string().optional(),
  CONSTELLATION_ENABLED: z.string().optional(),
  ECHO_ENABLED: z.string().optional(),
  ECHO_X_ENABLED: z.string().optional(),
  TWITTER_ENABLED: z.string().optional(),
  
  TWITTER_CLIENT_ID: z.string().optional(),
  TWITTER_CLIENT_SECRET: z.string().optional(),
  TWITTER_REDIRECT_URI: z.string().optional(),
  TWITTER_SCOPE: z.string().optional(),
  
  BASE_RPC_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  PINATA_JWT: z.string().optional(),
})
.superRefine((env, ctx) => {
  if (env.TWITTER_ENABLED === "1") {
    const requiredTwitterKeys = [
      "TWITTER_CLIENT_ID",
      "TWITTER_CLIENT_SECRET", 
      "TWITTER_REDIRECT_URI"
    ] as const;
    
    for (const key of requiredTwitterKeys) {
      if (!process.env[key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${key} is required when TWITTER_ENABLED=1`,
          path: [key]
        });
      }
    }
  }
  
  if (env.NODE_ENV === "production") {
    if (env.SESSION_SECRET === "dev-only-not-secret") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SESSION_SECRET must be changed from dev default in production",
        path: ["SESSION_SECRET"]
      });
    }
  }
});

const parsed = Env.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ ENVIRONMENT VALIDATION FAILED");
  console.error("========================================");
  console.error("Missing or invalid environment variables:");
  console.error("");
  
  for (const issue of parsed.error.issues) {
    const field = issue.path.join(".");
    console.error(`  ❌ ${field}: ${issue.message}`);
  }
  
  console.error("");
  console.error("========================================");
  console.error("🔧 To fix this:");
  console.error("  1. Go to Deploy → Deployment Secrets");
  console.error("  2. Add the missing environment variables");
  console.error("  3. Redeploy your application");
  console.error("========================================");
  
  process.exit(42);
} else {
  console.log("✅ Environment validation passed");
  console.log("  DATABASE_URL: [SET]");
  console.log("  SESSION_SECRET: [SET]");
  if (process.env.TWITTER_ENABLED === "1") {
    console.log("  Twitter OAuth: Enabled");
  }
  if (process.env.ECHO_ENABLED === "1") {
    console.log("  Echo feature: Enabled");
  }
}
