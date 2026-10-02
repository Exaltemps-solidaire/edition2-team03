// Reads the env + the Postgres secret from OpenBao at boot (§19 R-19-05:
// provisioning is replayed at every start, never assumed to survive a purge).

const APP = process.env.APP ?? "team03";
const PORT = Number(process.env.PORT ?? 8081);

const VAULT_ADDR = process.env.VAULT_ADDR ?? "http://openbao.internal:8200";
const VAULT_TOKEN = process.env.VAULT_TOKEN ?? "root-dev-token";
const VAULT_PATH = process.env.VAULT_PATH ?? `secret/${APP}/postgres`;

interface PostgresSecret {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
}

async function readPostgresSecret(): Promise<PostgresSecret> {
  const url = `${VAULT_ADDR}/v1/${VAULT_PATH.replace(/^secret\//, "secret/data/")}`;
  const resp = await fetch(url, { headers: { "X-Vault-Token": VAULT_TOKEN } });
  if (!resp.ok) {
    throw new Error(
      `[config] cannot read ${VAULT_PATH} from the secret store (HTTP ${resp.status}) — ` +
        `was bootstrap.sh run? (APP=${APP} ./bootstrap.sh)`,
    );
  }
  const body = (await resp.json()) as { data: { data: PostgresSecret } };
  return body.data.data;
}

export async function loadConfig() {
  const pgSecret = await readPostgresSecret();
  return {
    app: APP,
    port: PORT,
    databaseUrl:
      `postgres://${pgSecret.user}:${encodeURIComponent(pgSecret.password)}` +
      `@${pgSecret.host}:${pgSecret.port}/${pgSecret.database}`,
  };
}

export type Config = Awaited<ReturnType<typeof loadConfig>>;
