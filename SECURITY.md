# Security and credential handling

Service credentials belong in server environment variables. Never put OpenAI keys or hosted FGA client secrets into browser code, `VITE_` variables, example files or commits. The standalone public demo uses synthetic data and requires no service credentials.

## History cleanup

On 31 October 2026, previously embedded OpenAI keys and FGA client secrets were removed from the published branch histories. Author attribution, dates and project files were preserved. Both historical OpenAI keys were checked against the provider and rejected as invalid. History cleanup does not revoke credentials or remove copies held in old clones, deployments or GitHub caches.

If you cloned an earlier revision, use a fresh clone so an old branch cannot reintroduce those values. Configure your own credentials using `.env.example`; never copy historical configuration.

## Demo boundaries

The server-backed persona demo is limited to loopback development. Real-user endpoints require verified Auth0 access tokens, use server-side FGA checks and derive identity from signed claims. Local JSON storage is not a production database. The public standalone browser simulation is a teaching tool, not an enforcement boundary for real expense records.

Report vulnerabilities privately to ashish@ashishjha.ai. Do not post credentials in public issues.
