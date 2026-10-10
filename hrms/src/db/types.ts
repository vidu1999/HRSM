import type { NodePgDatabase, NodePgTransaction } from "drizzle-orm/node-postgres";
import type * as schema from "./schema";

export type DbClient = NodePgDatabase<typeof schema>;
export type DbTx = NodePgTransaction<typeof schema, any>;
