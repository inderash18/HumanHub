# Security and integration repair

This branch repairs registration verification, session refresh/revocation, private socket channels, and post moderation. It does not certify the application as production ready.

## Required setup before deployment

- Rotate the MongoDB credentials and JWT signing secret that were committed in `server/.env`. Removing that file from this branch does not remove historical exposure or invalidate old credentials. Provider credentials were not accessed or rotated by this patch.
- Copy `server/.env.example` to a local, untracked `server/.env`. Configure MongoDB, Redis, an exact `FRONTEND_URL`, and SMTP or Gmail delivery credentials. Generate a unique JWT secret of at least 32 characters using the command in the example.
- Use HTTPS and `NODE_ENV=production` in production. Refresh cookies are HttpOnly and SameSite=Lax, so deploy frontend and backend under the same site, preferably through the supplied reverse proxy. Different sites need a separately designed cookie/CSRF configuration.
- Existing bearer tokens are intentionally invalid: users must sign in again to obtain a database-backed session. Password reset revokes all sessions; logout revokes the current session; a ban revokes all account sessions.
- MongoDB creates the new `sessions` collection and its indexes. Test deployment and rollback against a disposable database first. No live database migration was run.
- No trained AI detector is bundled. The Python APIs report detection unavailable. New posts await moderator review at `/moderation`. Existing published posts are not retrospectively verified.
- Use an existing administrator/moderator account. This patch does not create privileged users or seed credentials.

## Changes

- Registration verification rejects an email/username conflict rather than signing into the matching account.
- OTP use checks expiry and attempt limits explicitly and consumes a valid code atomically. Email delivery failures no longer claim successful delivery or print OTPs to logs.
- Refresh secrets are random, hashed in MongoDB, and rotated atomically with a stable session ID. Access JWTs expire after 15 minutes and validate session state, verification, and bans. The frontend retries an expired authenticated request once and serializes refresh requests.
- Socket.IO authenticates access tokens and derives private channel identity on the server. Client-supplied sender/channel identities are ignored. Messages use the authenticated HTTP controller and incoming messages update the conversation UI.
- New posts are saved pending review. Queue or detector failures preserve pending content. Worker and moderator statuses match the schema. Moderator counts/audit/ban handlers use real database operations.
- Explicit CORS allowlist and origin checks protect authentication endpoints. Uploads use a strict MIME list, controlled extensions, and basic file-signature checks. These checks are not a full media decoder or malware scan.
- Fixed the existing missing notification export that prevented Express from importing its route tree.
- Deleted tracked `.env` files on the proposed branch. The original Git history still contains them.

## Verification

- 21 Node regression tests cover HTTP registration collisions, OTP expiry/attempt constraints and single-use behavior, origin rejection, refresh rotation, revoked/banned/expired sessions, logout cookies, authenticated socket channels, detector/queue outages, post creation, and basic media signatures.
- Tests use real Express, JWT, bcrypt and Socket.IO with mocked MongoDB/Redis/provider boundaries. They do not prove database concurrency, provider delivery, or deployment behavior.
- The Vite production build passes. Python entrypoints are syntax checked.
- GitHub Actions runs the regression suite and frontend build on pull requests.

## Remaining work from the audit

- Rotate exposed provider credentials and assess historical access through the provider consoles.
- Complete private-account/follower approval rules across feeds, profiles, comments, stories, and media. The message controller now honors the direct-message opt-out, but broad privacy enforcement is not complete.
- Replace experimental detectors with evaluated models and a documented moderation policy. No detection accuracy is claimed by this patch.
- Stories remain unmounted pending privacy/moderation integration. Other disconnected or simulated UI paths still require a separate review.
- Remove tracked `node_modules`, generated builds, uploaded files, and Python caches in a separate cleanup change; they are excluded from this patch's source review.
- Complete pagination, atomic social counters, dependency upgrades, media quarantine/storage controls, session UI and access-token storage hardening, browser end-to-end tests, and deployment checks.
