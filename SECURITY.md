# Credential handling and release status

This repository previously committed OpenAI keys and hosted FGA client secrets, including browser-side configuration. Current source removes those literals and keeps service credentials on the server. Prior commits still contain them.

Before changing repository visibility:

1. Revoke/rotate every historically committed OpenAI key and hosted FGA client secret in the provider consoles. Treat any previously deployed browser bundle with a service key as exposed too.
2. Update private deployment secrets with replacements and remove any `VITE_OPENAI_API_KEY` or browser-side FGA secret from hosting/build settings.
3. Prepare a clean public history or a separate clean public release, preserving attribution. Deleting a key from the latest commit does not remove older copies.

No credentials were rotated, no repository history was rewritten and no deployment was performed by this patch.

The persona demo is limited to loopback development. Real-user endpoints require verified Auth0 access tokens, use server-side FGA checks and derive identity from signed claims. The local JSON storage is not a production database.

Do not report a vulnerability by posting a credential in a public issue. Contact ashish@ashishjha.ai.
