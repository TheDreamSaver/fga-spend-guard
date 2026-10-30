# SmartSpend · authorization for an expense agent

A React/TypeScript demo of fine-grained access to expense records. Four synthetic personas illustrate ownership, management hierarchy, finance auditing and approval limits. The Express API applies permissions before returning records or changing an expense.

The optional AI layer summarizes records selected by the server. It cannot write expenses. Without an OpenAI key, the UI uses its deterministic query responses.

## Run locally

Requires Node.js 22.12+ and Docker (or an existing local OpenFGA server).

```sh
npm ci
cp .env.example .env
docker compose up -d
node openfga-setup.js
```

Copy the printed `OPENFGA_STORE_ID` and `OPENFGA_AUTHORIZATION_MODEL_ID` into `.env`. The setup creates a demo store/model and seeds the synthetic relationships. Start the API and UI in separate terminals:

```sh
npm run server
```

```sh
npm run dev
```

Open http://127.0.0.1:8080/demo. The API defaults to port 3001. The Vite and Express hosts bind to loopback. `DEMO_MODE=true` permits the explicit `X-Demo-User` persona header only outside production and on a loopback server. Persona selection is a demonstration tool, not authentication.

## What is enforced

- Expense lists are filtered by OpenFGA on the server, before reaching the browser or model.
- The server checks approval permissions, stored amounts, approval limits and self-approval restrictions. Request bodies cannot change the owner or amount while approving.
- Authorized managers can deny an expense above their spending limit and reset a decision; owners can resubmit a denied expense. Decision identity and dates are stamped by the API.
- New records belong to the current actor. The API creates their relationship tuples.
- Expense deletion checks ownership. Clients cannot administer relationship tuples.
- An unavailable authorization service stops access and generation.
- OpenAI and hosted OpenFGA credentials stay in server environment variables. No service key belongs in a `VITE_` variable.

`model.fga` describes the relationship graph. `openfga-setup.js` contains the equivalent API model and demo seed. Approval amounts are additional business rules enforced by the API.

## Optional Auth0 mode

Set the public `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID` and `VITE_AUTH0_AUDIENCE` values for a Single Page Application. Configure its callback as `http://127.0.0.1:8080/app` and its allowed web/logout origins accordingly.

On the server, configure `AUTH0_ISSUER_BASE_URL`, `AUTH0_AUDIENCE` and a separate `AUTH_OPENFGA_*` store/model. The API verifies RS256 access-token signatures, issuer, audience and expiry. It derives the actor from `sub`; it does not trust a request-body user ID or email. Seed the authenticated FGA store with those subject IDs and their owner/manager relationships.

`AUTH_USER_PROFILES` is a server-side JSON map from subject IDs to department and approval limit, for example:

```json
{"auth0|example-subject":{"department":"Engineering","limit":500}}
```

Missing profiles have no approval limit. An optional signed custom identity claim can be selected with matching `AUTH0_FGA_USER_CLAIM` and `VITE_AUTH0_FGA_USER_CLAIM` settings. The UI reads display limits from the authenticated profile endpoint; enforcement remains on the server.

For a hosted deployment, set `DEMO_MODE=false`, configure the real authentication and frontend origin, and provide durable storage. The file-backed storage here is intended for the local demo. The former Supabase/Vercel handlers return HTTP 410 because they bypassed this API’s identity and authorization checks.

## Optional AI summaries

Set server-only `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The existing default is `gpt-3.5-turbo`; choose a model available to your project. The browser sends a query to the API. The API independently loads authorized records and builds the context. There is no embedded key and no Ollama implementation in this version.

## Checks

```sh
npm test
npm run typecheck
npm run build
npm audit
```

Tests cover record filtering, missing/invalid credentials, user impersonation, direct mutation attempts, approval limits, relationship administration, AI context filtering, service outages, JWT validation and scoped/paginated tuple cleanup. Live Auth0 login and hosted credentials require the operator’s own configuration.

Only synthetic seeds are committed under `data/`. Runtime files live in ignored `.data/`. See [SECURITY.md](SECURITY.md) before publishing this repository’s existing history.

## License

[MIT](LICENSE). Built by Ashish Jha and contributors. More work: [ashishjha.ai](https://ashishjha.ai).
