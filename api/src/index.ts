import Fastify from "fastify";
import { loadConfig } from "./config.js";
import { createPool, migrate } from "./db.js";
import { AppError } from "./errors.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerTaskRoutes } from "./routes/tasks.js";

const config = await loadConfig();
const pg = createPool(config.databaseUrl);
await migrate(pg);

const app = Fastify({ logger: true });

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof AppError) {
    reply.code(err.statusCode).send({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }
  app.log.error(err);
  reply.code(500).send({ error: { code: "internal", message: "An error occurred" } });
});

registerHealthRoutes(app, pg);
registerTaskRoutes(app, pg);

const shutdown = async (signal: string) => {
  app.log.info({ signal }, "shutdown: draining...");
  await app.close();
  await pg.end();
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`[api] listening on :${config.port}`);
