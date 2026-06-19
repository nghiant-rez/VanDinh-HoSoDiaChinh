# Security Issues

Open security issues, severity, owners, and fix plan. Applied fixes live in `changelog.md`.

**Last updated**: 2026-06-19
**State context**: Nghia's branch has merged Huy's storage/DB-model work. `config.py` was NOT taken from Huy (see S3).

---

## S1: GitHub Personal Access Token Leaked

| Field | Value |
| --- | --- |
| Severity | CRITICAL |
| Status | OPEN - manual action required |
| Location | `.env:2` |
| Owner | Nghia (manual) |

**Details**: Token `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` was committed to the repo.

**Action**:
1. Revoke at https://github.com/settings/tokens
2. Generate a fine-grained PAT scoped to this repo only.
3. Update `.env` with the new token.
4. Confirm `.env` is in `.gitignore` (already done).

---

## S2: Header-Based Authentication Bypass

| Field | Value |
| --- | --- |
| Severity | CRITICAL |
| Status | OPEN - architectural refactor needed |
| Location | `backend/app/dependencies.py` `get_current_user` |
| Owner | Unassigned (coordinate Nghia + Huy) |

**Details**: Backend trusts a client-provided `X-User-Id` header. Any client can send `X-User-Id: 1` to impersonate the admin. No real server-side identity check.

**Current state**: The dummy-user fallback (`Header(1)` default and the bypass in `require_roles`) was removed on 2026-06-18, but the core design is still broken.

**Proper fix - pick one**:
- Option A: FastAPI validates Next.js iron-session cookies directly.
- Option B: FastAPI issues JWT tokens, stored in httpOnly cookies.
- Option C: FastAPI `OAuth2PasswordBearer` flow.

**Conflict risk**: Low - `dependencies.py` is touched on both branches but only for the already-applied dummy-user removal. The real fix is new code.

---

## S3: Hardcoded Database Password

| Field | Value |
| --- | --- |
| Severity | CRITICAL |
| Status | PARTIALLY RESOLVED - needs config merge |
| Location | `backend/app/config.py` |
| Owner | Nghia (merge Huy's URL fix + keep GIS settings) |

**Current state on Nghia's branch**:
```python
database_url: str = "postgresql://postgres:123456@localhost:5432/vandinh"
```

**Huy's fix (on `origin/Huy`)**:
```python
database_url: str = "postgresql://localhost:5432/vandinh"
```

**Why it is not resolved on Nghia's branch**: Nghia's `config.py` carries GIS settings (`dgn_source_path`, `gdal_bin_path`, `source_proj`) that Huy's branch does not have. When Nghia merged Huy's storage work, this file kept Nghia's version, so the weak password persisted.

**Fix**: Combine both - remove credentials from the URL (Huy's approach) and keep the GIS settings (Nghia's additions). Put the real connection string in `.env` as `DATABASE_URL`.

---

## Lower-Priority Open Items

These are not security-critical but should be tracked:

| ID | Item | Location | Owner |
| --- | --- | --- | --- |
| L1 | 8 `console.log` statements left in production code | various frontend components | TBD |
| L2 | Missing `loading.tsx`, `error.tsx`, `not-found.tsx` convention files | `src/app/` | TBD |
| L3 | OCR not implemented (PaddleOCR in requirements, no router/service) | `backend/app/` | TBD |

---

## Resolution Plan

### Phase 1 - Immediate (before any deployment)
1. **S1**: Nghia revokes the GitHub token manually.
2. **S3**: Merge Huy's `config.py` URL change into Nghia's GIS settings; move `DATABASE_URL` to `.env`.

### Phase 2 - Auth architecture
1. **S2**: Agree on Option A/B/C between Nghia and Huy.
2. Implement server-side identity validation in `backend/app/dependencies.py`.
3. Update all FastAPI routers and Next.js API routes to match the new auth flow.

### Phase 3 - Hardening
1. Remove `console.log` statements (L1).
2. Add convention files (L2).
3. Implement OCR for UC-09 (L3).
