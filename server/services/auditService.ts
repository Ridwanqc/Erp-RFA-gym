import { db, AuditLogEntity, SecurityEventEntity } from '../database/db';

// Masking helpers for sensitive data
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '-';
  const clean = phone.trim();
  if (clean.length < 8) return '****';
  return clean.slice(0, 4) + '****' + clean.slice(-4);
}

export function maskEmail(email?: string | null): string {
  if (!email) return '-';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  const username = parts[0];
  const domain = parts[1];
  const maskedUser = username.length <= 2 ? username[0] + '***' : username[0] + '***' + username.slice(-1);
  return `${maskedUser}@${domain}`;
}

export function sanitizeAuditData(data: any): string | null {
  if (!data) return null;
  const clone = typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : { value: data };
  
  // Strip secret and sensitive fields
  const forbiddenFields = ['password', 'passwordHash', 'refreshToken', 'token', 'jwt', 'secret', 'apiKey'];
  
  const sanitizeRecursive = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (forbiddenFields.some((f) => key.toLowerCase().includes(f))) {
        obj[key] = '[REDACTED_SECRET]';
      } else if (key.toLowerCase().includes('phone') && typeof obj[key] === 'string') {
        obj[key] = maskPhoneNumber(obj[key]);
      } else if (key.toLowerCase().includes('email') && typeof obj[key] === 'string') {
        obj[key] = maskEmail(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeRecursive(obj[key]);
      }
    }
  };

  sanitizeRecursive(clone);
  return JSON.stringify(clone);
}

export class AuditService {
  /**
   * Records an audit log entry for state-changing operations
   */
  static log(entry: {
    userId?: string | null;
    action: string;
    module: string;
    recordId?: string | null;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): AuditLogEntity {
    const audit: AuditLogEntity = {
      id: 'AUD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: entry.userId || null,
      action: entry.action.toUpperCase(),
      module: entry.module.toUpperCase(),
      recordId: entry.recordId || null,
      oldValue: sanitizeAuditData(entry.oldValue),
      newValue: sanitizeAuditData(entry.newValue),
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent ? entry.userAgent.slice(0, 255) : null,
      createdAt: new Date()
    };

    db.auditLogs.unshift(audit);

    // Keep log buffer bounded in memory (latest 1000 items)
    if (db.auditLogs.length > 1000) {
      db.auditLogs.pop();
    }

    return audit;
  }

  /**
   * Records a security event (e.g. BRUTE_FORCE, IDOR_ATTEMPT, PRICE_TAMPER)
   */
  static recordSecurityEvent(event: {
    eventType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    ipAddress?: string | null;
    userAgent?: string | null;
    userId?: string | null;
    details: string;
  }): SecurityEventEntity {
    const secEvent: SecurityEventEntity = {
      id: 'SEC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      eventType: event.eventType.toUpperCase(),
      severity: event.severity,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent ? event.userAgent.slice(0, 255) : null,
      userId: event.userId || null,
      details: event.details,
      resolved: false,
      createdAt: new Date()
    };

    db.securityEvents.unshift(secEvent);

    if (db.securityEvents.length > 500) {
      db.securityEvents.pop();
    }

    return secEvent;
  }
}
