import { defineConfig } from "drizzle-kit";
import {config } from "dotenv"

config()

export default defineConfig({
  dialect: "postgresql",
  schema: "./schema/**/*.schema.ts",
  out: "./migration",
  dbCredentials:{
    url:process.env.DATABASE_URL!,
  }
});
