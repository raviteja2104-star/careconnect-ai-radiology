/**
 * AuthorizationService — single authorization authority for CareConnect.
 *
 * All middleware MUST import from here, never directly from PermissionService.
 * This creates a stable contract that lets us add caching, audit hooks, or
 * policy extensions in one place without touching callers.
 *
 * ── Permission semantics ──────────────────────────────────────────────────────
 *
 * getEffectivePermissions(userId)
 *   Returns the user's resolved permission set after applying deny-overrides:
 *   1. Union all active, non-expired UserRole.role.permissions
 *   2. Apply active, non-expired UserPermissionOverride records:
 *      - granted: true  → add permission (even if no role grants it)
 *      - granted: false → remove permission (even if a role grants it)
 *   Deny always wins: a single deny override removes a permission regardless
 *   of how many roles grant it.
 *
 * userHasPermissions(userId, requiredPermissions) — AND semantics
 *   Returns true only when the user's effective set contains EVERY listed
 *   permission. Used by permit(...perms).
 *
 * ── Deny-override interaction with permitAny ──────────────────────────────────
 *
 * permitAny(A, B, C) checks whether the user's EFFECTIVE set contains at
 * least one of A, B, or C. Because getEffectivePermissions already applies
 * deny-overrides, a permission denied by override is simply absent from the
 * set — permitAny(A, B, C) still succeeds if A or B are present, even when
 * C has a deny-override. This is intentional and correct: OR semantics with
 * deny-overrides applied pre-check.
 */

const {
    getEffectivePermissions,
    userHasPermissions,
    ensureUserHasRole,
} = require('./PermissionService');

module.exports = { getEffectivePermissions, userHasPermissions, ensureUserHasRole };
