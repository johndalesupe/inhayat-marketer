# Production deployment

This app is built in GitHub Actions and deployed as an immutable GHCR image.
The VPS does not run npm installation or Next compilation. It uses the dedicated
`inhayat-edge` network owned by `intimhayot-server`; no app port is published.

Application ID: `marketer-web`. Default domain: `marketing.inhayat.com`.
Image repository: `ghcr.io/johndalesupe/inhayat-marketer`.

Follow the server's [production migration and CI runbook](../intimhayot-server/deploy/production/README.md).
The workflow needs repository variables `DEPLOY_HOST`, `DEPLOY_USER`,
`DEPLOY_PORT`, `ENABLE_PRODUCTION_DEPLOY` and the public build settings shown
in `.github/workflows/deploy.yml`. Production-environment secrets are `DEPLOY_SSH_KEY`,
`DEPLOY_KNOWN_HOSTS`. A separate repository secret holds a stable 32-byte base64
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`. Runtime values belong in the VPS's private
`/opt/inhayat/env/marketer-web.env`, mode 0600. Public Next variables are baked in at
build time; runtime env does not replace them.

The central controller health-checks `/api/health`, verifies the new Traefik
route, retains previous static assets for open tabs, and drains the previous
container before removing it. Failed candidates leave the previous release
serving traffic. Every release requires memory headroom and takes the host-wide
deployment lock. The root Compose file is an image-only manual startup example;
it does not perform traffic switching on its own.

After provisioning the host, a manual release uses:

`python3 /opt/inhayat-controller/deploy.py deploy marketer-web ghcr.io/johndalesupe/inhayat-marketer@sha256:DIGEST`

Use `status marketer-web`, `recover marketer-web` or `rollback marketer-web` with the same controller.
Do not run `docker compose down` or build on the production VPS.
