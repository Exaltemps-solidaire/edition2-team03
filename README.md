# team03

## Overview
Liste de tâches (todo list) : un front React et une API Bun/Fastify, les
tâches sont enregistrées dans le Postgres de la core platform. Usage interne
à l'équipe pour l'épreuve du hackathon.

## Getting started
```bash
chmod +x bootstrap.sh && APP=team03 ./bootstrap.sh
cd frontend && bun install && bun run build && cd ..
cd api && bun install --production && cd ..
podman build -t localhost:5000/team03/frontend:dev frontend/
podman build -t localhost:5000/team03/api:dev api/
podman push localhost:5000/team03/frontend:dev
podman push localhost:5000/team03/api:dev
APP=team03 podman compose -p team03 up -d --force-recreate
```
Ou via le pipeline : `gitlab-ci-local --force-shell-executor` (`ACTION=start|stop|purge`).

Vérification :
```bash
curl http://localhost:8081/health
curl http://localhost:8081/ready
curl http://localhost:8080/
curl http://localhost:8080/api/v1/tasks
```

## Design vocabulary
Aucun — l'interface est volontairement minimale (HTML natif, pas de kit de
composants), le périmètre de l'épreuve ne justifie pas de thème.

## Code language
fr — identifiants métier (`tasks`, `title`, `done`) en anglais technique
courant, libellés UI en français.

## Tested critical paths
Parcours vérifié manuellement de bout en bout à travers le front (port 8080,
via le proxy `/api/` de nginx) : créer une tâche → la lister → la cocher
(`done=true`) → la supprimer → re-supprimer (idempotence 204).

## Performance
Aucun endpoint au-delà de 100 ms — CRUD synchrone direct sur une table sans
jointure ; pas de pagination nécessaire au périmètre de l'épreuve.

## Personal data register
Aucune donnée personnelle : les tâches ne contiennent qu'un titre libre saisi
par l'utilisateur, aucun champ identifiant une personne.

## External data sources
None.

## Exposed interfaces
REST `/api/v1/tasks` (GET liste, POST création, PATCH mise à jour partielle,
DELETE suppression idempotente) + `/health` et `/ready`.

## LLM FinOps
None — application non agentique, aucun appel LLM.

## Durable workflows
None — CRUD synchrone, aucun besoin d'orchestration durable.

## Libraries outside the recommendations
None — Fastify + `pg` côté API (recommandations §8.1/§8.2), React + Vite côté
front (stack imposée §2).

## Structuring decisions
- **Pas de service `worker`** : aucune tâche asynchrone/différée dans un CRUD
  todo list ; en ajouter un aurait été une complexité gratuite (§0 KISS).
- **UUID générés côté application** (`crypto.randomUUID()`) plutôt que
  `gen_random_uuid()` côté Postgres : l'extension `pgcrypto` exige des droits
  superutilisateur que le rôle applicatif provisionné par `bootstrap.sh` n'a
  pas.
- **Appels API en chemin relatif** (`/api/v1/tasks`) depuis le front, aucune
  configuration CORS : imposé par `CLAUDE.md` de la machine — front et API
  sont servis sur une seule origine pour le visiteur, une URL absolue
  casserait silencieusement la démo.
- **`location /api/` dans le nginx du front**, en plus du routage probable de
  la plateforme : robustesse si l'app est testée directement sur le port 8080
  sans passer par le proxy d'entrée.

## CCoE waivers
- **Deux ports (8080/8081) au lieu du bloc de dix prescrit par les
  guidelines génériques** — imposé par `CLAUDE.md` de la machine : le
  pare-feu de la VM ne laisse passer que ces deux ports vers l'extérieur.
  Pas de date d'expiration, propre à l'infrastructure de cette VM.
