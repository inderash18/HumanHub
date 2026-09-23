# Authentication, Session, and MFA Architecture Design

## 1. Password Protection & Argon2id Migration

### Argon2id Configuration (OWASP ASVS V2.4 Standard)
* **Algorithm:** Argon2id
* **Memory Cost (`memoryCost`):** 65,536 KiB (64 MiB)
* **Time Cost (`timeCost`):** 3 iterations
* **Parallelism (`parallelism`):** 4 threads
* **Output Length:** 32 bytes
* **Password Limits:** 8 to 128 characters (allowing long passphrases and password manager pasting while bounding CPU load).

### Zero-Data-Loss Migration Flow
1. User submits plaintext password on login `/api/auth/login`.
2. Backend inspects stored `passwordHash`:
   - If hash starts with `$argon2id$`: Verify with `@node-rs/argon2`.
   - If hash starts with `$2` (legacy bcrypt): Verify with `bcrypt.compare`.
3. Upon successful verification of a legacy bcrypt hash:
   - Compute new Argon2id hash asynchronously.
   - Update `user.passwordHash` in MongoDB immediately without disrupting the login response.
   - Update `user.passwordVersion` to invalidate stale session tokens.

---

## 2. Session Management & Refresh Token Rotation

### Architecture
* **Access Tokens (JWT):**
  - Lifetime: 15 minutes.
  - Algorithms: Explicit `HS256`.
  - Issuer: `humanhub`.
  - Audience: `humanhub-client`.
  - Stored in browser memory only (Zustand state store).
* **Refresh Tokens (Opaque CSPRNG):**
  - 48 bytes of cryptographically secure random bytes (96-character hex string).
  - Stored in MongoDB `Session` collection as a SHA-256 hash.
  - Delivered to browser via `HttpOnly`, `SameSite=Lax`, `Secure` cookie on path `/api/auth`.
* **Atomic Rotation & Replay Detection:**
  - Every call to `/api/auth/refresh` rotates the refresh token secret atomically using `findOneAndUpdate`.
  - If a revoked or already rotated token is presented, the session is invalidated immediately, protecting against token theft replay attacks.
* **Session Revocation Controls:**
  - `/api/auth/logout`: Revokes current active session and clears cookies.
  - `/api/auth/sessions`: Lists active sessions (device metadata, IP, last active time).
  - `/api/auth/sessions/:id`: Revokes specific session and disconnects associated Socket.IO connections.
  - `/api/auth/sessions/revoke-others`: Revokes all other sessions except current.
  - Password reset or admin ban immediately revokes ALL active sessions.

---

## 3. Multi-Factor Authentication (MFA) & Recovery

### TOTP Setup & Verification
1. User initiates setup via `POST /api/auth/mfa/setup` (requires active session).
2. Server generates standard RFC 6238 Base32 secret and `otpauth://` URI.
3. Secret is encrypted at rest using **AES-256-GCM** with a managed 256-bit key (`MFA_ENCRYPTION_KEY`).
4. User scans QR code in authenticator app and confirms with code via `POST /api/auth/mfa/enable`.
5. Server verifies code, records `mfa.lastUsedTimestep` to prevent code replay, and issues **10 single-use backup recovery codes**.
6. Backup recovery codes are hashed (SHA-256) prior to database persistence.

### Login with MFA
1. When a user with MFA enabled submits valid password credentials to `/api/auth/login`:
   - Server does NOT return an access token or issue a session cookie.
   - Server returns `{ mfaRequired: true, challengeId: '<uuid>' }`.
2. User submits authenticator code or backup recovery code to `POST /api/auth/mfa/verify-login`.
3. Upon successful TOTP verification or consumption of an unused backup code, the session is issued and cookie set.
