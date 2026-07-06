# chat-api

Chat backend for krystianslowik.com. Express + TypeScript, proxies chat
requests to OpenAI (streaming upstream, plain JSON to the client), with an
in-memory rate limiter and optional MySQL request/response logging.

## Endpoints

- `POST /chat` — body `{"conversation": [{"role": "user", "content": "..."}]}`,
  responds `{"message": "..."}`. Rate limited: 20 requests/min per IP, then a
  bot challenge, then a 5-minute block.
- `GET /healthz` — liveness/readiness probe, responds `{"status": "ok"}`.

## Run locally

```sh
cp .env.example .env   # fill in OPENAI_API_KEY
npm install
npm run dev            # tsx watch, restarts on change
```

`npm run typecheck`, `npm run build` (tsc to `dist/`), `npm start` (compiled).

## Build the image

```sh
docker build -t registry.local/chat-api:latest .
docker push registry.local/chat-api:latest
```

## Deploy to the homelab

Create the secret once (see `k8s/secret.example.yaml`, do not commit real
values), point `k8s/deployment.yaml` at your image, then:

```sh
kubectl apply -k k8s/
```

Ingress serves `chat-api.krystianslowik.com` via Traefik; uncomment the
cert-manager annotation in `k8s/ingress.yaml` to enable TLS issuance.

## Environment

| Variable        | Required | Default                                             | Purpose                                        |
| --------------- | -------- | --------------------------------------------------- | ---------------------------------------------- |
| OPENAI_API_KEY  | yes      | —                                                   | OpenAI API key; server exits at boot if unset  |
| PORT            | no       | 3000                                                | HTTP listen port                               |
| OPENAI_MODEL    | no       | gpt-4o                                              | Chat completion model                          |
| ALLOWED_ORIGINS | no       | https://krystianslowik.com,http://localhost:4321    | Comma-separated CORS allowlist                 |
| DATABASE_URL    | no       | —                                                   | MySQL DSN for logging; stdout-only when unset  |
