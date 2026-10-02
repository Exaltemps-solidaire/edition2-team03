import { useEffect, useState } from "react";
import type { Task } from "./types";
import { listTasks, createTask, updateTask, deleteTask } from "./api";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const task = await createTask(trimmed);
      setTasks((prev) => [task, ...prev]);
      setTitle("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleToggle(task: Task) {
    try {
      const updated = await updateTask(task.id, { done: !task.done });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Liste de tâches</h1>
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche"
          style={{ flex: 1, padding: "0.5rem" }}
        />
        <button type="submit">Ajouter</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Chargement…</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0" }}
            >
              <input type="checkbox" checked={task.done} onChange={() => handleToggle(task)} />
              <span style={{ flex: 1, textDecoration: task.done ? "line-through" : "none" }}>
                {task.title}
              </span>
              <button onClick={() => handleDelete(task.id)}>Supprimer</button>
            </li>
          ))}
          {tasks.length === 0 && <li>Aucune tâche pour le moment.</li>}
        </ul>
      )}
    </main>
  );
}
