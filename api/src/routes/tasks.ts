import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { AppError } from "../errors.js";

interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export function registerTaskRoutes(app: FastifyInstance, pg: Pool) {
  app.get("/api/v1/tasks", async () => {
    const r = await pg.query<TaskRow>("SELECT * FROM tasks ORDER BY created_at DESC");
    return { tasks: r.rows };
  });

  app.post<{ Body: { title?: unknown } }>("/api/v1/tasks", async (req, reply) => {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      throw new AppError({
        code: "validation.field_missing",
        message: "Field 'title' missing",
        statusCode: 400,
        details: { field: "title" },
      });
    }
    const id = randomUUID();
    const r = await pg.query<TaskRow>(
      "INSERT INTO tasks (id, title) VALUES ($1, $2) RETURNING *",
      [id, title],
    );
    reply.code(201).header("Location", `/api/v1/tasks/${id}`);
    return r.rows[0];
  });

  app.patch<{ Params: { id: string }; Body: { title?: unknown; done?: unknown } }>(
    "/api/v1/tasks/:id",
    async (req) => {
      const { id } = req.params;
      const fields: string[] = [];
      const values: unknown[] = [];
      let i = 1;

      if (req.body?.title !== undefined) {
        const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
        if (!title) {
          throw new AppError({
            code: "validation.field_invalid",
            message: "Field 'title' must be a non-empty string",
            statusCode: 400,
            details: { field: "title" },
          });
        }
        fields.push(`title = $${i++}`);
        values.push(title);
      }
      if (req.body?.done !== undefined) {
        fields.push(`done = $${i++}`);
        values.push(Boolean(req.body.done));
      }
      if (fields.length === 0) {
        throw new AppError({
          code: "validation.empty_update",
          message: "No field to update",
          statusCode: 400,
        });
      }

      values.push(id);
      const r = await pg.query<TaskRow>(
        `UPDATE tasks SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
        values,
      );
      if (r.rowCount === 0) {
        throw new AppError({
          code: "resource.not_found",
          message: "Task not found",
          statusCode: 404,
          details: { id },
        });
      }
      return r.rows[0];
    },
  );

  app.delete<{ Params: { id: string } }>("/api/v1/tasks/:id", async (req, reply) => {
    await pg.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    reply.code(204);
  });
}
