import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";

export function registerHealthRoutes(app: FastifyInstance, pg: Pool) {
  // Liveness — no dependency, must answer even when the app is saturated.
  app.get("/health", async () => ({ status: "ok" }));

  // Readiness — hits the critical dependency (Postgres).
  app.get("/ready", async (_req, reply) => {
    try {
      await pg.query("SELECT 1");
      return { status: "ready", checks: { postgres: "ok" } };
    } catch {
      reply.code(503);
      return { status: "not_ready", checks: { postgres: "down" } };
    }
  });
}
