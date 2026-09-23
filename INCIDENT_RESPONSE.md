# Security Incident Response & Playbooks

## 1. Incident Response Lifecycle
HumanHub follows the NIST SP 800-61 Incident Handling framework:
1. **Preparation:** Logging of authentication, authorization, and administrative events; pre-configured backup and revocation tooling.
2. **Detection & Analysis:** Monitoring rate-limit spikes, repeated MFA challenge failures, and unauthorized private resource access attempts.
3. **Containment:** Targeted session revocation, user account suspension, or IP throttling.
4. **Eradication:** Secret rotation, vulnerability patching on dedicated security branches.
5. **Recovery:** Safe credential re-issue, database restoration from verified snapshots.
6. **Post-Incident Review:** Root-cause analysis and threat model updates.

---

## 2. Emergency Security Playbooks

### Playbook A: User Account Compromise / Token Theft
1. **Revoke All Active Sessions:**
   ```bash
   # Via Administrator API or MongoDB Shell
   mongosh --eval 'db.sessions.updateMany({ user: ObjectId("<USER_ID>") }, { $set: { revokedAt: new Date() } })'
   ```
2. **Force Password Reset:**
   - Invalidate `user.passwordVersion` (increments by 1).
   - Clear any pending OTP or reset challenges.
3. **Notify User:**
   - Dispatch security notification email via SMTP service.

---

### Playbook B: Compromise of JWT Signing Secret or Database Credentials
1. **Immediate JWT Secret Rotation:**
   - Generate a new 256-bit secret: `openssl rand -hex 32`.
   - Update `JWT_SECRET` in production `.env` and perform zero-downtime rolling restart of `backend`.
   - *Impact:* All active bearer tokens become instantly invalid; users will transparently refresh or sign in again.
2. **Database Credential Rotation:**
   - Update MongoDB / Redis authentication passwords.
   - Update `MONGODB_URI` and restart application containers.

---

### Playbook C: Unauthorized Private Media Access
1. **Quarantine or Invalidate Media:**
   - Remove the affected file from `server/uploads/` or mark the database record as `status: 'blocked'`.
2. **Purge Cache:**
   - If a CDN (e.g. Cloudflare) is in front of the application, issue an immediate purge for the specific media URL.

---

### Playbook D: Database Snapshot Restoration & Rollback
1. **Stop Application Services:**
   ```bash
   docker compose -f docker-compose.prod.yml stop backend frontend
   ```
2. **Restore MongoDB Volume:**
   ```bash
   mongorestore --drop --gzip --archive=/backups/humanhub-snapshot-<TIMESTAMP>.gz
   ```
3. **Restart Stack & Verify Health:**
   ```bash
   docker compose -f docker-compose.prod.yml start
   ```
