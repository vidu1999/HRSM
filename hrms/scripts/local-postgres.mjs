// Starts a local PostgreSQL server for development without Docker.
// Usage: node scripts/local-postgres.mjs   (listens on localhost:5432, user/password hrms/hrms, db hrms)
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";

const dataDir = new URL("../.embedded-postgres/data", import.meta.url).pathname;
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "hrms",
  password: "hrms",
  port: 5432,
  persistent: true,
});

const first = !fs.existsSync(dataDir);
if (first) await pg.initialise();
await pg.start();
try {
  await pg.createDatabase("hrms");
} catch {
  // database already exists
}
console.log("PostgreSQL running on localhost:5432 (db: hrms, user: hrms)");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
