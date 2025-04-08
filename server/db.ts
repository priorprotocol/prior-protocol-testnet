import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// Create a PostgreSQL client instance
const client = postgres(process.env.DATABASE_URL!);

// Create a drizzle instance using the client and schema
export const db = drizzle(client, { schema });