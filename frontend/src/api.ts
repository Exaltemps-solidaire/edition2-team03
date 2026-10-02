import type { Task } from "./types";

const BASE = "/api/v1/tasks";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      // réponse sans corps JSON (ex: 204)
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function listTasks(): Promise<Task[]> {
  return fetch(BASE)
    .then((res) => handle<{ tasks: Task[] }>(res))
    .then((body) => body.tasks);
}

export function createTask(title: string): Promise<Task> {
  return fetch(BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  }).then((res) => handle<Task>(res));
}

export function updateTask(id: string, patch: Partial<Pick<Task, "title" | "done">>): Promise<Task> {
  return fetch(`${BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then((res) => handle<Task>(res));
}

export function deleteTask(id: string): Promise<void> {
  return fetch(`${BASE}/${id}`, { method: "DELETE" }).then((res) => handle<void>(res));
}
