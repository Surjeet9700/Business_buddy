# ============================================
# BUSINESS BUDDY - DEPLOYMENT CHECKLIST
# Production readiness verification
# ============================================

## PRE-DEPLOYMENT

### Environment Configuration
- [ ] `DATABASE_URL` set with connection pooling (e.g., PgBouncer)
- [ ] `JWT_SECRET` is cryptographically random (min 256 bits)
- [ ] `JWT_REFRESH_SECRET` separate from access token secret
- [ ] `CORS_ORIGINS` whitelist configured
- [ ] `NODE_ENV=production`
- [ ] `LOG_LEVEL=info` (not debug)
- [ ] Rate limiter Redis URL configured

### Database
- [ ] Run `prisma migrate deploy`
- [ ] Run seed script for roles/permissions
- [ ] Create initial admin user
- [ ] Verify all indexes exist
- [ ] Enable connection pooling
- [ ] Set statement timeout (30s recommended)
- [ ] Configure automated backups

### Security Headers (via Helmet.js)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Strict-Transport-Security` enabled
- [ ] `Content-Security-Policy` configured

### SSL/TLS
- [ ] HTTPS enforced on all endpoints
- [ ] HTTP redirects to HTTPS
- [ ] TLS 1.2+ only
- [ ] Valid SSL certificate
- [ ] HSTS header configured

---

## INFRASTRUCTURE

### Server
- [ ] Node.js 20 LTS
- [ ] Process manager (PM2 or systemd)
- [ ] Automatic restart on crash
- [ ] Memory limits configured
- [ ] CPU limits configured

### Database
- [ ] PostgreSQL 15+
- [ ] Dedicated database user (not superuser)
- [ ] Read replicas for analytics queries
- [ ] Point-in-time recovery enabled
- [ ] Automated daily backups

### Redis (for rate limiting)
- [ ] Persistent storage enabled
- [ ] Password protected
- [ ] TLS enabled

### Logging
- [ ] Structured JSON logs
- [ ] Log aggregation configured
- [ ] Error alerting enabled
- [ ] Audit logs retained 90+ days

---

## MONITORING

### Health Checks
- [ ] `/api/v1/health` endpoint monitored
- [ ] Database connectivity check
- [ ] Response time alerts (<500ms P95)

### Metrics
- [ ] Request rate
- [ ] Error rate (target <0.1%)
- [ ] Response time distribution
- [ ] Active users
- [ ] Workflow completion rate

### Alerts
- [ ] Error rate spike
- [ ] Response time degradation
- [ ] Database connection failures
- [ ] Disk space warnings
- [ ] Memory usage warnings

---

## SECURITY VERIFICATION

### Authentication
- [ ] Password hashing cost factor = 12
- [ ] Access token expiry = 15 minutes
- [ ] Refresh token expiry = 7 days
- [ ] Failed login lockout after 10 attempts
- [ ] Session invalidation on password change

### Authorization
- [ ] All routes require authentication (except /auth/*)
- [ ] RBAC middleware on all protected routes
- [ ] Resource-level permission checks verified
- [ ] Admin cannot delete themselves
- [ ] Ownership checks on user resources

### Input Validation
- [ ] Zod schemas on all endpoints
- [ ] Request body size limit (1MB)
- [ ] File upload restrictions
- [ ] SQL injection testing passed
- [ ] XSS testing passed

### Rate Limiting
- [ ] Global: 1000 req/15min
- [ ] Auth: 5 attempts/15min
- [ ] Password reset: 3/hour

---

## DATA PROTECTION

- [ ] PII encryption at rest
- [ ] Sensitive data not logged
- [ ] Audit logging enabled
- [ ] Data retention policy configured
- [ ] GDPR compliance verified (if applicable)

---

## BACKUP & RECOVERY

- [ ] Database backup tested
- [ ] Restore procedure documented
- [ ] RTO defined (<4 hours)
- [ ] RPO defined (<1 hour)
- [ ] Disaster recovery plan documented

---

## API DOCUMENTATION

- [ ] OpenAPI/Swagger spec generated
- [ ] All endpoints documented
- [ ] Authentication flow documented
- [ ] Error codes documented
- [ ] Rate limits documented

---

## FINAL CHECKS

- [ ] Load testing completed
- [ ] Security penetration testing completed
- [ ] Dependency audit (npm audit)
- [ ] No high/critical vulnerabilities
- [ ] Rollback procedure documented
- [ ] On-call rotation established

---

## POST-DEPLOYMENT

- [ ] Smoke test all critical paths
- [ ] Verify audit logging
- [ ] Verify error alerting
- [ ] Monitor first 24 hours
- [ ] Document any issues found


# ============================================
# AEM CONCEPT MAPPING
# How Business Buddy mirrors Adobe Experience Manager
# ============================================

| AEM Concept | Business Buddy Equivalent | Notes |
|-------------|---------------------------|-------|
| **Components** | Form Fields (FormField type) | Reusable, typed, configurable |
| **Templates** | Form Schemas (FormVersion) | Versioned, JSON-based structure |
| **Content Fragments** | Form Submissions | Structured data tied to schemas |
| **Workflows** | Workflow Engine | Multi-step, role-based approvals |
| **User Groups** | Roles (admin/manager/contributor/viewer) | Hierarchical permissions |
| **ACLs** | Form Permissions + RBAC | Resource + action based |
| **Audit Trail** | AuditLog table | All critical actions logged |
| **Versioning** | FormVersion table | Full version history |
| **DAM** | (Not implemented) | Would need file storage integration |
| **Dispatcher** | (N/A - SPA model) | React handles caching |

### Design Philosophy Alignment

1. **Modularity**: Like AEM components, form fields are self-contained with their own validation and rendering logic.

2. **Separation of Concerns**: Frontend (React) is purely presentational. All business logic enforced by Express backend.

3. **Versioning**: Forms maintain full version history, similar to AEM's content versioning.

4. **Workflow Engine**: State machine mirrors AEM's workflow model with steps, approvers, and transitions.

5. **RBAC**: Permission model follows enterprise patterns - roles contain permissions, permissions are resource:action pairs.
