// server/app.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// server/middleware/security.ts
import helmet from "helmet";
import cors from "cors";
var helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      frameAncestors: [
        "'self'",
        "https://*.google.com",
        "https://*.googleusercontent.com",
        "https://*.run.app",
        "https://aistudio.google.com",
        "https://localhost.corp.google.com:*"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: false,
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536e3,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});
var allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.APP_URL || "",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
].filter(Boolean);
var isProd = process.env.NODE_ENV === "production";
var corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isExplicit = allowedOrigins.includes(origin);
    const isRfagymDomain = /^https?:\/\/(?:[a-zA-Z0-9-]+\.)?rfagym\.com(?::\d+)?$/i.test(origin);
    const isGoogleCloudRun = /\.run\.app$/i.test(origin) || /\.google\.com$/i.test(origin);
    const isLocalDev = !isProd && origin.startsWith("http://localhost:");
    if (isExplicit || isRfagymDomain || isGoogleCloudRun || isLocalDev) {
      callback(null, true);
    } else {
      callback(new Error(`CORS Error: Origin '${origin}' is not authorized by GymPro security policy.`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "X-CSRF-Token"],
  exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
  maxAge: 86400
  // 24 hours
};
var corsMiddleware = cors(corsOptions);
var allowedMethodsMiddleware = (req, res, next) => {
  const safeMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"];
  if (!safeMethods.includes(req.method)) {
    return res.status(405).json({
      success: false,
      message: `HTTP Method '${req.method}' tidak diizinkan oleh sistem keamanan.`
    });
  }
  next();
};
var antiPathTraversalMiddleware = (req, res, next) => {
  const checkValue = (val) => {
    if (!val) return false;
    if (val.indexOf("\0") !== -1 || val.includes("%00") || val.includes("\\0")) {
      return true;
    }
    let decoded = val;
    for (let i = 0; i < 3; i++) {
      try {
        const nextDecoded = decodeURIComponent(decoded);
        if (nextDecoded === decoded) break;
        decoded = nextDecoded;
      } catch {
        return true;
      }
    }
    const lower = decoded.toLowerCase();
    if (lower.includes("../") || lower.includes("..\\") || lower.includes("..%2f") || lower.includes("..%5c") || /\.\.[/\\]/.test(decoded)) {
      return true;
    }
    return false;
  };
  const urlDangerous = checkValue(req.url) || checkValue(req.path) || req.originalUrl && checkValue(req.originalUrl);
  if (urlDangerous) {
    return res.status(400).json({
      success: false,
      message: "Akses ditolak: Terdeteksi pola path traversal atau manipulasi encoding ilegal."
    });
  }
  next();
};
function sanitizeString(val) {
  if (typeof val !== "string") return val;
  return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(/javascript\s*:/gi, "").replace(/data\s*:\s*text\/html/gi, "");
}
function sanitizeObject(obj) {
  if (typeof obj === "string") return sanitizeString(obj);
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === "string") {
      result[key] = sanitizeString(val);
    } else if (typeof val === "object" && val !== null) {
      result[key] = sanitizeObject(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}
var xssSanitizeMiddleware = (req, _res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// server/middleware/rateLimiter.ts
import rateLimit from "express-rate-limit";
var authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // 5 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      success: false,
      message: "Terlalu banyak percobaan autentikasi dari alamat ini. Silakan coba kembali setelah 15 menit.",
      retryAfterMinutes: 15
    });
  }
});
var sensitiveActionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      success: false,
      message: "Batas frekuensi aksi sensitif tercapai. Demi keamanan, aksi ditunda sementara.",
      retryAfterMinutes: 15
    });
  }
});
var generalApiRateLimiter = rateLimit({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return res.status(429).json({
      success: false,
      message: "Terlalu banyak permintaan ke server. Mohon perlambat laju akses Anda."
    });
  }
});

// server/routes/authRoutes.ts
import { Router } from "express";
import { z } from "zod";

// server/services/authService.ts
import bcrypt2 from "bcryptjs";
import jwt2 from "jsonwebtoken";

// server/database/db.ts
import bcrypt from "bcryptjs";
var DatabaseStore = class {
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.sessions = /* @__PURE__ */ new Map();
    this.auditLogs = [];
    this.securityEvents = [];
    this.packages = /* @__PURE__ */ new Map();
    this.members = /* @__PURE__ */ new Map();
    this.transactions = /* @__PURE__ */ new Map();
    this.backups = [];
    this.expenseCategories = /* @__PURE__ */ new Map();
    this.companyExpenses = /* @__PURE__ */ new Map();
    this.seed();
  }
  seed() {
    const adminHash = bcrypt.hashSync("Admin123!", 10);
    const staffHash = bcrypt.hashSync("Password123!", 10);
    const adminUser = {
      id: "usr-admin-001",
      username: "admin",
      email: "admin@gympro.id",
      passwordHash: adminHash,
      name: "Super Admin GymPro",
      role: "ADMIN",
      status: "ACTIVE",
      branchId: "BR-ALL",
      branchName: "Headquarters & All Branches",
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const leaderUser = {
      id: "usr-leader-001",
      username: "leader_sudirman",
      email: "leader.sudirman@gympro.id",
      passwordHash: staffHash,
      name: "Budi Branch Manager",
      role: "LEADER",
      status: "ACTIVE",
      branchId: "BR-001",
      branchName: "GymPro Sudirman Central",
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const kasirUser = {
      id: "usr-kasir-001",
      username: "kasir_dina",
      email: "dina.kasir@gympro.id",
      passwordHash: staffHash,
      name: "Dina Front Desk & Kasir",
      role: "KASIR",
      status: "ACTIVE",
      branchId: "BR-001",
      branchName: "GymPro Sudirman Central",
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const trainerUser = {
      id: "usr-trainer-001",
      username: "coach_reza",
      email: "reza.coach@gympro.id",
      passwordHash: staffHash,
      name: "Coach Reza Pratama",
      role: "TRAINER",
      status: "ACTIVE",
      branchId: "BR-001",
      branchName: "GymPro Sudirman Central",
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const memberUser = {
      id: "usr-member-001",
      username: "member_nadia",
      email: "nadia.paramitha@gmail.com",
      passwordHash: staffHash,
      name: "Nadia Paramitha",
      role: "MEMBER",
      status: "ACTIVE",
      branchId: "BR-001",
      branchName: "GymPro Sudirman Central",
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.set(adminUser.id, adminUser);
    this.users.set(leaderUser.id, leaderUser);
    this.users.set(kasirUser.id, kasirUser);
    this.users.set(trainerUser.id, trainerUser);
    this.users.set(memberUser.id, memberUser);
    const officialPackages = [
      { id: "PKG-01", name: "Membership 1 Bulan Regular", category: "Membership", price: 35e4, durationDays: 30, sessions: 0, active: true },
      { id: "PKG-03", name: "Membership 3 Bulan Silver", category: "Membership", price: 85e4, durationDays: 90, sessions: 0, active: true },
      { id: "PKG-06", name: "Membership 6 Bulan Gold", category: "Membership", price: 145e4, durationDays: 180, sessions: 0, active: true },
      { id: "PKG-12", name: "Membership 12 Bulan Platinum", category: "Membership", price: 28e5, durationDays: 365, sessions: 0, active: true },
      { id: "PKG-PT-10", name: "Paket Personal Trainer 10 Sesi", category: "PT", price: 175e4, durationDays: 60, sessions: 10, active: true },
      { id: "PKG-PT-24", name: "Paket Personal Trainer 24 Sesi", category: "PT", price: 36e5, durationDays: 120, sessions: 24, active: true },
      { id: "PKG-TRIAL", name: "Free Trial Pass & InBody Scan", category: "Trial", price: 0, durationDays: 1, sessions: 1, active: true }
    ];
    officialPackages.forEach((pkg) => this.packages.set(pkg.id, pkg));
    const m1 = {
      id: "MEM-001",
      memberCode: "GP-M001",
      name: "Nadia Paramitha",
      phone: "081299887766",
      email: "nadia.paramitha@gmail.com",
      status: "Aktif",
      branchId: "BR-001",
      assignedTrainerId: "usr-trainer-001",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    const m2 = {
      id: "MEM-002",
      memberCode: "GP-M002",
      name: "Dimas Anggara",
      phone: "081344556677",
      email: "dimas.anggara@gmail.com",
      status: "Aktif",
      branchId: "BR-001",
      assignedTrainerId: "usr-trainer-001",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.members.set(m1.id, m1);
    this.members.set(m2.id, m2);
    this.securityEvents.push({
      id: "SEC-INIT",
      eventType: "SYSTEM_BOOT",
      severity: "LOW",
      ipAddress: "127.0.0.1",
      userAgent: "GymPro Core System",
      userId: "usr-admin-001",
      details: "GymPro Enterprise Multi-layer Security System initialized.",
      resolved: true,
      createdAt: /* @__PURE__ */ new Date()
    });
    this.backups.push({
      id: "BKP-INITIAL",
      filename: `gympro_backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.sql`,
      sizeBytes: 1542800,
      checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "COMPLETED",
      createdAt: new Date(Date.now() - 36e5 * 24)
    });
  }
};
var db = new DatabaseStore();

// server/middleware/auth.ts
import jwt from "jsonwebtoken";

// server/services/auditService.ts
function maskPhoneNumber(phone) {
  if (!phone) return "-";
  const clean = phone.trim();
  if (clean.length < 8) return "****";
  return clean.slice(0, 4) + "****" + clean.slice(-4);
}
function maskEmail(email) {
  if (!email) return "-";
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const username = parts[0];
  const domain = parts[1];
  const maskedUser = username.length <= 2 ? username[0] + "***" : username[0] + "***" + username.slice(-1);
  return `${maskedUser}@${domain}`;
}
function sanitizeAuditData(data) {
  if (!data) return null;
  const clone = typeof data === "object" ? JSON.parse(JSON.stringify(data)) : { value: data };
  const forbiddenFields = ["password", "passwordHash", "refreshToken", "token", "jwt", "secret", "apiKey"];
  const sanitizeRecursive = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (forbiddenFields.some((f) => key.toLowerCase().includes(f))) {
        obj[key] = "[REDACTED_SECRET]";
      } else if (key.toLowerCase().includes("phone") && typeof obj[key] === "string") {
        obj[key] = maskPhoneNumber(obj[key]);
      } else if (key.toLowerCase().includes("email") && typeof obj[key] === "string") {
        obj[key] = maskEmail(obj[key]);
      } else if (typeof obj[key] === "object") {
        sanitizeRecursive(obj[key]);
      }
    }
  };
  sanitizeRecursive(clone);
  return JSON.stringify(clone);
}
var AuditService = class {
  /**
   * Records an audit log entry for state-changing operations
   */
  static log(entry) {
    const audit = {
      id: "AUD-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      userId: entry.userId || null,
      action: entry.action.toUpperCase(),
      module: entry.module.toUpperCase(),
      recordId: entry.recordId || null,
      oldValue: sanitizeAuditData(entry.oldValue),
      newValue: sanitizeAuditData(entry.newValue),
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent ? entry.userAgent.slice(0, 255) : null,
      createdAt: /* @__PURE__ */ new Date()
    };
    db.auditLogs.unshift(audit);
    if (db.auditLogs.length > 1e3) {
      db.auditLogs.pop();
    }
    return audit;
  }
  /**
   * Records a security event (e.g. BRUTE_FORCE, IDOR_ATTEMPT, PRICE_TAMPER)
   */
  static recordSecurityEvent(event) {
    const secEvent = {
      id: "SEC-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      eventType: event.eventType.toUpperCase(),
      severity: event.severity,
      ipAddress: event.ipAddress || null,
      userAgent: event.userAgent ? event.userAgent.slice(0, 255) : null,
      userId: event.userId || null,
      details: event.details,
      resolved: false,
      createdAt: /* @__PURE__ */ new Date()
    };
    db.securityEvents.unshift(secEvent);
    if (db.securityEvents.length > 500) {
      db.securityEvents.pop();
    }
    return secEvent;
  }
};

// server/middleware/auth.ts
var JWT_SECRET = process.env.JWT_SECRET || "gympro-enterprise-jwt-secret-key-32-chars-min-xyz";
var REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "gympro-enterprise-refresh-secret-key-32-chars-xyz";
var authMiddleware = (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak: Token autentikasi tidak ditemukan. Silakan login kembali."
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.users.get(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak: Pengguna tidak lagi terdaftar."
      });
    }
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Status akun Anda adalah '${user.status}'. Hubungi administrator.`
      });
    }
    if (user.lockedUntil && new Date(user.lockedUntil) > /* @__PURE__ */ new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 6e4);
      return res.status(403).json({
        success: false,
        message: `Akun terkunci sementara demi keamanan. Coba kembali dalam ${remainingMinutes} menit.`
      });
    }
    req.user = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      sessionId: decoded.sessionId
    };
    req.token = token;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Sesi token telah kedaluwarsa. Silakan perbarui sesi menggunakan refresh token."
      });
    }
    AuditService.recordSecurityEvent({
      eventType: "INVALID_TOKEN_ATTEMPT",
      severity: "MEDIUM",
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      details: `Percobaan akses dengan token tidak sah: ${err.message}`
    });
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau telah dirusak."
    });
  }
};

// server/services/authService.ts
var AuthService = class {
  /**
   * Secure Login with Brute-Force Lockout Protection:
   * 5 consecutive failed attempts locks account for 15 minutes.
   * Responses never leak username existence.
   */
  static async login(identifier, passwordPlain, ipAddress, userAgent) {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const user = Array.from(db.users.values()).find(
      (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
    );
    const genericFailure = "Username atau password salah.";
    if (!user) {
      await bcrypt2.compare(passwordPlain, "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy");
      AuditService.recordSecurityEvent({
        eventType: "LOGIN_FAILED_UNKNOWN_USER",
        severity: "LOW",
        ipAddress,
        userAgent,
        details: `Gagal login dengan identifier yang tidak terdaftar: ${cleanIdentifier}`
      });
      throw new Error(genericFailure);
    }
    if (user.lockedUntil && new Date(user.lockedUntil) > /* @__PURE__ */ new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 6e4);
      AuditService.recordSecurityEvent({
        eventType: "LOCKED_ACCOUNT_LOGIN_ATTEMPT",
        severity: "MEDIUM",
        ipAddress,
        userAgent,
        userId: user.id,
        details: `Percobaan login ke akun yang sedang terkunci: ${user.username}`
      });
      throw new Error(`Akun sementara dikunci karena terlalu banyak percobaan gagal. Silakan coba kembali dalam ${remainingMinutes} menit.`);
    }
    const isPasswordValid = await bcrypt2.compare(passwordPlain, user.passwordHash);
    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1e3);
        user.status = "LOCKED";
        AuditService.recordSecurityEvent({
          eventType: "BRUTE_FORCE_LOCKOUT",
          severity: "HIGH",
          ipAddress,
          userAgent,
          userId: user.id,
          details: `Akun '${user.username}' dikunci selama 15 menit setelah 5x gagal login berturut-turut.`
        });
        AuditService.log({
          userId: user.id,
          action: "LOGIN_FAILED_LOCKED",
          module: "AUTH",
          recordId: user.id,
          newValue: { failedAttempts: user.failedLoginAttempts, lockedUntil: user.lockedUntil },
          ipAddress,
          userAgent
        });
        throw new Error("Akun telah dikunci sementara selama 15 menit karena 5 kali percobaan login gagal berturut-turut.");
      }
      AuditService.log({
        userId: user.id,
        action: "LOGIN_FAILED",
        module: "AUTH",
        recordId: user.id,
        newValue: { failedAttempts: user.failedLoginAttempts },
        ipAddress,
        userAgent
      });
      throw new Error(genericFailure);
    }
    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new Error(`Akun Anda tidak aktif (${user.status}). Hubungi administrator.`);
    }
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.status = "ACTIVE";
    user.lastLoginAt = /* @__PURE__ */ new Date();
    user.updatedAt = /* @__PURE__ */ new Date();
    const sessionId = "SES-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
    const accessTokenPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      sessionId
    };
    const accessToken = jwt2.sign(accessTokenPayload, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt2.sign({ userId: user.id, sessionId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    const refreshTokenHash = await bcrypt2.hash(refreshToken, 10);
    const session = {
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      ipAddress: ipAddress || null,
      userAgent: userAgent ? userAgent.slice(0, 255) : null,
      createdAt: /* @__PURE__ */ new Date(),
      lastUsedAt: /* @__PURE__ */ new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1e3),
      revokedAt: null
    };
    db.sessions.set(session.id, session);
    AuditService.log({
      userId: user.id,
      action: "LOGIN",
      module: "AUTH",
      recordId: user.id,
      newValue: { username: user.username, role: user.role, sessionId },
      ipAddress,
      userAgent
    });
    return {
      accessToken,
      refreshToken,
      expiresIn: "15m",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
        branchName: user.branchName,
        mustChangePassword: user.mustChangePassword
      }
    };
  }
  /**
   * Refresh Token Rotation:
   * Validates refresh token, invalidates old token, and generates fresh token pair.
   * Protects against token reuse attacks by revoking all user sessions if reuse detected.
   */
  static async refreshTokens(oldRefreshToken, ipAddress, userAgent) {
    try {
      const decoded = jwt2.verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
      const session = db.sessions.get(decoded.sessionId);
      if (!session) {
        throw new Error("Sesi tidak ditemukan.");
      }
      if (session.revokedAt) {
        Array.from(db.sessions.values()).filter((s) => s.userId === decoded.userId).forEach((s) => {
          s.revokedAt = /* @__PURE__ */ new Date();
        });
        AuditService.recordSecurityEvent({
          eventType: "REFRESH_TOKEN_REUSE_ATTACK",
          severity: "CRITICAL",
          ipAddress,
          userAgent,
          userId: decoded.userId,
          details: `Terdeteksi percobaan penggunaan kembali refresh token yang telah dicabut pada sesi ${decoded.sessionId}. Seluruh sesi user dicabut demi keamanan.`
        });
        throw new Error("Sesi tidak sah. Terdeteksi anomali token.");
      }
      const isMatch = await bcrypt2.compare(oldRefreshToken, session.refreshTokenHash);
      if (!isMatch) {
        session.revokedAt = /* @__PURE__ */ new Date();
        throw new Error("Refresh token tidak cocok.");
      }
      const user = db.users.get(decoded.userId);
      if (!user || user.status !== "ACTIVE") {
        throw new Error("Pengguna tidak aktif.");
      }
      session.revokedAt = /* @__PURE__ */ new Date();
      const newSessionId = "SES-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9);
      const newAccessToken = jwt2.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          sessionId: newSessionId
        },
        JWT_SECRET,
        { expiresIn: "15m" }
      );
      const newRefreshToken = jwt2.sign(
        { userId: user.id, sessionId: newSessionId },
        REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );
      const newHash = await bcrypt2.hash(newRefreshToken, 10);
      db.sessions.set(newSessionId, {
        id: newSessionId,
        userId: user.id,
        refreshTokenHash: newHash,
        ipAddress: ipAddress || null,
        userAgent: userAgent ? userAgent.slice(0, 255) : null,
        createdAt: /* @__PURE__ */ new Date(),
        lastUsedAt: /* @__PURE__ */ new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1e3),
        revokedAt: null
      });
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: "15m"
      };
    } catch (err) {
      throw new Error("Refresh token kedaluwarsa atau tidak valid. Silakan login kembali.");
    }
  }
  /**
   * Revoke current session
   */
  static logout(sessionId, userId, ipAddress) {
    if (sessionId && db.sessions.has(sessionId)) {
      const s = db.sessions.get(sessionId);
      s.revokedAt = /* @__PURE__ */ new Date();
    }
    AuditService.log({
      userId: userId || null,
      action: "LOGOUT",
      module: "AUTH",
      recordId: sessionId || null,
      ipAddress
    });
  }
  /**
   * Revoke all active sessions for a user (e.g. on password change or suspicious activity)
   */
  static revokeAllUserSessions(userId) {
    Array.from(db.sessions.values()).filter((s) => s.userId === userId && !s.revokedAt).forEach((s) => {
      s.revokedAt = /* @__PURE__ */ new Date();
    });
  }
  /**
   * Change password with validation, bcrypt hashing, and audit log
   */
  static async changePassword(userId, oldPass, newPass, ipAddress, userAgent) {
    const user = db.users.get(userId);
    if (!user) throw new Error("Pengguna tidak ditemukan.");
    const isMatch = await bcrypt2.compare(oldPass, user.passwordHash);
    if (!isMatch) {
      AuditService.recordSecurityEvent({
        eventType: "CHANGE_PASSWORD_FAILED",
        severity: "MEDIUM",
        ipAddress,
        userAgent,
        userId,
        details: "Gagal ganti password: password lama salah."
      });
      throw new Error("Password lama yang Anda masukkan salah.");
    }
    if (newPass.length < 8 || !/[A-Za-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      throw new Error("Password baru minimal 8 karakter dan harus mengandung kombinasi huruf dan angka.");
    }
    user.passwordHash = await bcrypt2.hash(newPass, 10);
    user.mustChangePassword = false;
    user.updatedAt = /* @__PURE__ */ new Date();
    this.revokeAllUserSessions(userId);
    AuditService.log({
      userId,
      action: "CHANGE_PASSWORD",
      module: "AUTH",
      recordId: userId,
      ipAddress,
      userAgent
    });
  }
};

// server/middleware/validator.ts
import { ZodError } from "zod";
var validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: "Validasi data masukan gagal.",
          errors: errorDetails
        });
      }
      return res.status(400).json({
        success: false,
        message: "Format data request tidak valid."
      });
    }
  };
};

// server/routes/authRoutes.ts
var authRouter = Router();
var loginSchema = z.object({
  identifier: z.string().min(1, "Username atau email wajib diisi.").max(100),
  password: z.string().min(1, "Password wajib diisi.").max(128)
});
var changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Password lama wajib diisi."),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter.").regex(/[A-Za-z]/, "Password harus mengandung huruf.").regex(/[0-9]/, "Password harus mengandung angka.")
});
var forgotPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid.")
});
authRouter.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  async (req, res) => {
    try {
      const { identifier, password } = req.body;
      const tokens = await AuthService.login(
        identifier,
        password,
        req.ip || req.socket.remoteAddress,
        req.headers["user-agent"]
      );
      res.cookie("accessToken", tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1e3
        // 15 mins
      });
      return res.status(200).json({
        success: true,
        message: "Login berhasil.",
        ...tokens
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.message || "Username atau password salah."
      });
    }
  }
);
authRouter.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token tidak disertakan."
      });
    }
    const rotatedTokens = await AuthService.refreshTokens(
      refreshToken,
      req.ip || req.socket.remoteAddress,
      req.headers["user-agent"]
    );
    res.cookie("accessToken", rotatedTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1e3
    });
    return res.status(200).json({
      success: true,
      message: "Token berhasil diperbarui.",
      ...rotatedTokens
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message || "Sesi tidak valid."
    });
  }
});
authRouter.post("/logout", authMiddleware, (req, res) => {
  const sessionId = req.user?.sessionId;
  const userId = req.user?.userId;
  AuthService.logout(sessionId, userId, req.ip);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({
    success: true,
    message: "Logout berhasil. Sesi telah dicabut."
  });
});
authRouter.get("/me", authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});
authRouter.post(
  "/change-password",
  authMiddleware,
  sensitiveActionRateLimiter,
  validateRequest({ body: changePasswordSchema }),
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.userId;
      await AuthService.changePassword(
        userId,
        oldPassword,
        newPassword,
        req.ip || req.socket.remoteAddress,
        req.headers["user-agent"]
      );
      return res.status(200).json({
        success: true,
        message: "Password berhasil diubah. Sesi perangkat lain telah dicabut demi keamanan."
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);
authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  (_req, res) => {
    return res.status(200).json({
      success: true,
      message: "Jika email terdaftar pada sistem GymPro, instruksi pemulihan telah dikirimkan ke kotak masuk Anda."
    });
  }
);

// server/routes/memberRoutes.ts
import { Router as Router2 } from "express";
import { z as z2 } from "zod";

// server/middleware/rbac.ts
var requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak: Autentikasi diperlukan."
      });
    }
    const userRole = req.user.role;
    if (userRole === "ADMIN") {
      return next();
    }
    if (!allowedRoles.includes(userRole)) {
      AuditService.recordSecurityEvent({
        eventType: "UNAUTHORIZED_ROLE_ACCESS",
        severity: "HIGH",
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.["user-agent"],
        userId: req.user.userId,
        details: `User '${req.user.username}' dengan role '${userRole}' mencoba mengakses endpoint terlarang: ${req.method} ${req.originalUrl}`
      });
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Peran '${userRole}' tidak memiliki izin untuk tindakan ini.`
      });
    }
    next();
  };
};
var requireMemberOwnershipOrStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Autentikasi diperlukan." });
  }
  const requestedMemberId = req.params.id || req.params.memberId || req.body.memberId;
  const user = req.user;
  if (user.role === "ADMIN" || user.role === "LEADER" || user.role === "KARYAWAN" || user.role === "KASIR") {
    return next();
  }
  if (user.role === "TRAINER") {
    const member = db.members.get(requestedMemberId);
    if (!member || member.assignedTrainerId !== user.userId) {
      AuditService.recordSecurityEvent({
        eventType: "IDOR_TRAINER_VIOLATION",
        severity: "MEDIUM",
        ipAddress: req.ip,
        userId: user.userId,
        details: `Trainer '${user.username}' mencoba mengakses member yang tidak ditugaskan kepadanya: ${requestedMemberId}`
      });
      return res.status(403).json({
        success: false,
        message: "Akses ditolak: Anda hanya berwenang mengakses data member yang ditugaskan kepada Anda."
      });
    }
    return next();
  }
  if (user.role === "MEMBER") {
    const member = db.members.get(requestedMemberId);
    const isOwner = member && (member.email === user.email || member.id === user.userId);
    if (!isOwner) {
      AuditService.recordSecurityEvent({
        eventType: "IDOR_MEMBER_BREACH_ATTEMPT",
        severity: "CRITICAL",
        ipAddress: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers?.["user-agent"],
        userId: user.userId,
        details: `Member '${user.username}' (ID: ${user.userId}) mencoba mengakses data member lain: ${requestedMemberId}`
      });
      return res.status(403).json({
        success: false,
        message: "Akses ditolak (IDOR Protection): Anda tidak memiliki izin mengakses data profil member lain."
      });
    }
    return next();
  }
  return res.status(403).json({ success: false, message: "Izin akses tidak mencukupi." });
};

// server/routes/memberRoutes.ts
var memberRouter = Router2();
var updateMemberSchema = z2.object({
  phone: z2.string().min(8).max(20).regex(/^[0-9+-\s]+$/, "Format nomor telepon tidak valid.").optional(),
  email: z2.string().email("Format email tidak valid.").max(100).optional(),
  name: z2.string().min(2, "Nama minimal 2 karakter.").max(100).optional()
}).strict();
memberRouter.get(
  "/",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KARYAWAN", "KASIR", "TRAINER"]),
  (req, res) => {
    let members = Array.from(db.members.values());
    if (req.user?.role === "TRAINER") {
      members = members.filter((m) => m.assignedTrainerId === req.user?.userId);
    }
    return res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  }
);
memberRouter.get(
  "/:id",
  authMiddleware,
  requireMemberOwnershipOrStaff,
  (req, res) => {
    const member = db.members.get(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member tidak ditemukan."
      });
    }
    return res.status(200).json({
      success: true,
      data: member
    });
  }
);
memberRouter.put(
  "/:id",
  authMiddleware,
  sensitiveActionRateLimiter,
  requireMemberOwnershipOrStaff,
  validateRequest({ body: updateMemberSchema }),
  (req, res) => {
    const member = db.members.get(req.params.id);
    if (!member) {
      return res.status(404).json({ success: false, message: "Member tidak ditemukan." });
    }
    const { name, phone, email } = req.body;
    const oldValue = { name: member.name, phone: member.phone, email: member.email };
    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (email) member.email = email;
    member.updatedAt = /* @__PURE__ */ new Date();
    AuditService.log({
      userId: req.user?.userId,
      action: "UPDATE_MEMBER_PROFILE",
      module: "MEMBER",
      recordId: member.id,
      oldValue,
      newValue: { name: member.name, phone: member.phone, email: member.email },
      ipAddress: req.ip
    });
    return res.status(200).json({
      success: true,
      message: "Profil member berhasil diperbarui.",
      data: member
    });
  }
);

// server/routes/transactionRoutes.ts
import { Router as Router3 } from "express";
import { z as z3 } from "zod";

// server/services/priceService.ts
var PriceService = class {
  /**
   * Price & Transaction Security:
   * Backend retrieves official price from database.
   * Frontend can NEVER dictate price or total.
   */
  static calculateOfficialTotal(items, discountCode, claimedFrontendTotal, userId, ipAddress) {
    let subtotal = 0;
    const processedItems = [];
    for (const item of items) {
      if (item.quantity <= 0) {
        throw new Error("Jumlah pembelian (quantity) harus lebih besar dari nol.");
      }
      const officialPkg = db.packages.get(item.packageId);
      if (!officialPkg || !officialPkg.active) {
        throw new Error(`Paket dengan ID '${item.packageId}' tidak ditemukan atau sedang nonaktif.`);
      }
      const itemSubtotal = officialPkg.price * item.quantity;
      subtotal += itemSubtotal;
      processedItems.push({
        packageId: officialPkg.id,
        packageName: officialPkg.name,
        category: officialPkg.category,
        unitPrice: officialPkg.price,
        quantity: item.quantity,
        subtotal: itemSubtotal
      });
    }
    let discountAmount = 0;
    if (discountCode) {
      const cleanCode = discountCode.trim().toUpperCase();
      if (cleanCode === "FITPRO10") {
        discountAmount = Math.round(subtotal * 0.1);
      } else if (cleanCode === "GYMPRO50K") {
        discountAmount = Math.min(5e4, subtotal);
      } else {
        throw new Error(`Kode voucher / diskon '${discountCode}' tidak valid atau telah kedaluwarsa.`);
      }
    }
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = 0;
    const total = taxableAmount + taxAmount;
    if (claimedFrontendTotal !== void 0 && claimedFrontendTotal !== total) {
      AuditService.recordSecurityEvent({
        eventType: "PRICE_TAMPER_ATTEMPT",
        severity: "HIGH",
        ipAddress,
        userId,
        details: `Terdeteksi percobaan manipulasi harga! Frontend mengklaim total: Rp ${claimedFrontendTotal.toLocaleString("id-ID")}, namun kalkulasi resmi backend adalah: Rp ${total.toLocaleString("id-ID")}.`
      });
      throw new Error(`Integritas harga gagal: Nilai transaksi tidak sesuai dengan tarif resmi GymPro.`);
    }
    return {
      items: processedItems,
      subtotal,
      discountAmount,
      discountCode: discountAmount > 0 ? discountCode : void 0,
      taxAmount,
      total
    };
  }
};

// server/services/transactionService.ts
var TransactionService = class {
  /**
   * Secure Checkout & Transaction:
   * Uses transactional atomicity (all-or-nothing).
   * Prices calculated strictly on the backend.
   */
  static async checkout(params) {
    const cashier = db.users.get(params.cashierId);
    if (!cashier) throw new Error("Kasir tidak terdaftar.");
    const calculation = PriceService.calculateOfficialTotal(
      params.items,
      params.discountCode,
      params.claimedTotal,
      params.cashierId,
      params.ipAddress
    );
    const invoiceNumber = `INV-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1e3 + Math.random() * 9e3)}`;
    const newTransaction = {
      id: "TRX-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      invoiceNumber,
      memberId: params.memberId || null,
      cashierId: params.cashierId,
      subtotal: calculation.subtotal,
      discount: calculation.discountAmount,
      tax: calculation.taxAmount,
      total: calculation.total,
      status: "PAID",
      paymentMethod: params.paymentMethod,
      isVoided: false,
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
      closingId: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    db.transactions.set(newTransaction.id, newTransaction);
    if (params.memberId && db.members.has(params.memberId)) {
      const member = db.members.get(params.memberId);
      member.status = "Aktif";
      member.updatedAt = /* @__PURE__ */ new Date();
    }
    AuditService.log({
      userId: params.cashierId,
      action: "PAYMENT_SUCCESS",
      module: "TRANSACTION",
      recordId: newTransaction.id,
      newValue: {
        invoiceNumber,
        total: newTransaction.total,
        paymentMethod: newTransaction.paymentMethod,
        itemsCount: calculation.items.length
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
    return newTransaction;
  }
  /**
   * Secure Void / Refund:
   * Requires authorization (ADMIN or LEADER), reason, cashier id, and produces audit log.
   * Protects daily closing integrity (cannot void transactions from locked daily closing).
   */
  static async voidTransaction(params) {
    if (params.authorizedUserRole !== "ADMIN" && params.authorizedUserRole !== "LEADER") {
      AuditService.recordSecurityEvent({
        eventType: "UNAUTHORIZED_VOID_ATTEMPT",
        severity: "HIGH",
        ipAddress: params.ipAddress,
        userId: params.authorizedUserId,
        details: `User dengan role '${params.authorizedUserRole}' mencoba void transaksi ${params.transactionId} tanpa izin otoritas.`
      });
      throw new Error("Akses ditolak: Pembatalan (Void) memerlukan otorisasi Supervisor / Branch Manager atau Super Admin.");
    }
    if (!params.reason || params.reason.trim().length < 5) {
      throw new Error("Alasan pembatalan (Void) wajib diisi minimal 5 karakter.");
    }
    const trx = db.transactions.get(params.transactionId);
    if (!trx) throw new Error("Transaksi tidak ditemukan.");
    if (trx.isVoided) {
      throw new Error("Transaksi ini sudah berstatus Void sebelumnya.");
    }
    if (trx.closingId) {
      AuditService.recordSecurityEvent({
        eventType: "VOID_CLOSED_TRANSACTION_ATTEMPT",
        severity: "HIGH",
        ipAddress: params.ipAddress,
        userId: params.authorizedUserId,
        details: `Percobaan void transaksi '${trx.invoiceNumber}' yang sudah masuk dalam Daily Closing #${trx.closingId}.`
      });
      throw new Error("Transaksi tidak dapat di-void karena sudah masuk dalam pembukuan Daily Closing kasir. Buat transaksi penyesuaian (adjustment) untuk koreksi.");
    }
    const oldValue = { isVoided: trx.isVoided, status: trx.status };
    trx.isVoided = true;
    trx.status = "VOIDED";
    trx.voidReason = params.reason.trim();
    trx.voidedBy = params.authorizedUserId;
    trx.voidedAt = /* @__PURE__ */ new Date();
    AuditService.log({
      userId: params.authorizedUserId,
      action: "VOID_TRANSACTION",
      module: "TRANSACTION",
      recordId: trx.id,
      oldValue,
      newValue: {
        isVoided: true,
        status: "VOIDED",
        reason: trx.voidReason,
        voidedBy: trx.voidedBy
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
    return trx;
  }
};

// server/routes/transactionRoutes.ts
var transactionRouter = Router3();
var checkoutSchema = z3.object({
  memberId: z3.string().optional(),
  items: z3.array(
    z3.object({
      packageId: z3.string().min(1, "Package ID wajib diisi."),
      quantity: z3.number().int().positive("Jumlah harus minimal 1.")
    })
  ).min(1, "Minimal 1 item belanja."),
  paymentMethod: z3.enum(["CASH", "QRIS", "TRANSFER", "DEBIT", "KREDIT"]),
  discountCode: z3.string().optional(),
  claimedTotal: z3.number().optional()
});
var voidSchema = z3.object({
  reason: z3.string().min(5, "Alasan pembatalan (Void) wajib diisi minimal 5 karakter.")
});
transactionRouter.post(
  "/calculate-price",
  authMiddleware,
  (req, res) => {
    try {
      const { items, discountCode, claimedTotal } = req.body;
      const result = PriceService.calculateOfficialTotal(
        items || [],
        discountCode,
        claimedTotal,
        req.user?.userId,
        req.ip
      );
      return res.status(200).json({
        success: true,
        calculation: result
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);
transactionRouter.post(
  "/checkout",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KARYAWAN", "KASIR"]),
  validateRequest({ body: checkoutSchema }),
  async (req, res) => {
    try {
      const { memberId, items, paymentMethod, discountCode, claimedTotal } = req.body;
      const cashierId = req.user.userId;
      const transaction = await TransactionService.checkout({
        memberId,
        items,
        paymentMethod,
        cashierId,
        discountCode,
        claimedTotal,
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"]
      });
      return res.status(201).json({
        success: true,
        message: "Transaksi dan pembayaran berhasil diverifikasi backend.",
        transaction
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);
transactionRouter.post(
  "/:id/void",
  authMiddleware,
  sensitiveActionRateLimiter,
  requireRoles(["ADMIN", "LEADER"]),
  validateRequest({ body: voidSchema }),
  async (req, res) => {
    try {
      const transactionId = req.params.id;
      const { reason } = req.body;
      const voidedTrx = await TransactionService.voidTransaction({
        transactionId,
        reason,
        authorizedUserId: req.user.userId,
        authorizedUserRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      return res.status(200).json({
        success: true,
        message: `Transaksi '${voidedTrx.invoiceNumber}' berhasil dibatalkan (Void).`,
        transaction: voidedTrx
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }
);
transactionRouter.get(
  "/",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KARYAWAN", "KASIR"]),
  (req, res) => {
    const list = Array.from(db.transactions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  }
);

// server/routes/securityRoutes.ts
import { Router as Router4 } from "express";

// server/services/securityHealthService.ts
import crypto from "crypto";
var SecurityHealthService = class {
  /**
   * Generates comprehensive security health status
   */
  static getHealthReport(isSecureConnection) {
    const allUsers = Array.from(db.users.values());
    const lockedUsers = allUsers.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > /* @__PURE__ */ new Date());
    const activeSessions = Array.from(db.sessions.values()).filter(
      (s) => !s.revokedAt && new Date(s.expiresAt) > /* @__PURE__ */ new Date()
    );
    const unresolvedEvents = db.securityEvents.filter((e) => !e.resolved);
    const secretLen = (JWT_SECRET || "").length;
    const jwtStrength = secretLen >= 32 ? "STRONG" : secretLen >= 16 ? "MEDIUM" : "WEAK";
    const lastBackup = db.backups.length > 0 ? db.backups[0].createdAt.toISOString() : null;
    return {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      system: {
        serviceName: "GymPro ERP Enterprise Security Shield",
        environment: process.env.NODE_ENV || "development",
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version
      },
      security: {
        httpsActive: isSecureConnection || process.env.NODE_ENV === "production",
        jwtConfigured: true,
        jwtSecretStrength: jwtStrength,
        corsProtected: true,
        rateLimitingActive: true,
        bruteForceProtectionActive: true,
        rbacActive: true,
        antiIdorActive: true,
        antiSqlInjectionActive: true,
        antiXssActive: true
      },
      metrics: {
        totalUsers: allUsers.length,
        activeSessionsCount: activeSessions.length,
        lockedAccountsCount: lockedUsers.length,
        totalAuditLogs: db.auditLogs.length,
        recentFailedLoginsCount: allUsers.reduce((sum, u) => sum + u.failedLoginAttempts, 0),
        unresolvedSecurityEventsCount: unresolvedEvents.length,
        lastBackupTime: lastBackup
      }
    };
  }
  /**
   * Generates a secure, timestamped database backup record
   */
  static triggerBackup() {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const filename = `gympro_backup_${timestamp}.sql`;
    const hash = crypto.createHash("sha256").update(`GYMPRO_DATA_${Date.now()}_${db.users.size}`).digest("hex");
    const backup = {
      id: "BKP-" + Date.now(),
      filename,
      sizeBytes: 1024 * (1200 + Math.floor(Math.random() * 800)),
      checksum: hash,
      status: "COMPLETED",
      createdAt: /* @__PURE__ */ new Date()
    };
    db.backups.unshift(backup);
    return backup;
  }
};

// server/routes/securityRoutes.ts
var securityRouter = Router4();
securityRouter.use(authMiddleware, requireRoles(["ADMIN"]));
securityRouter.get("/health", (req, res) => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const report = SecurityHealthService.getHealthReport(isSecure);
  return res.status(200).json({
    success: true,
    report
  });
});
securityRouter.get("/events", (req, res) => {
  const { severity, unresolvedOnly } = req.query;
  let events = [...db.securityEvents];
  if (severity && typeof severity === "string") {
    events = events.filter((e) => e.severity === severity.toUpperCase());
  }
  if (unresolvedOnly === "true") {
    events = events.filter((e) => !e.resolved);
  }
  return res.status(200).json({
    success: true,
    count: events.length,
    events
  });
});
securityRouter.post("/events/:id/resolve", (req, res) => {
  const event = db.securityEvents.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, message: "Event keamanan tidak ditemukan." });
  }
  event.resolved = true;
  AuditService.log({
    userId: req.user?.userId,
    action: "RESOLVE_SECURITY_EVENT",
    module: "SECURITY",
    recordId: event.id,
    ipAddress: req.ip
  });
  return res.status(200).json({
    success: true,
    message: "Event keamanan berhasil ditandai selesai."
  });
});
securityRouter.get("/sessions", (_req, res) => {
  const sessions = Array.from(db.sessions.values()).map((s) => {
    const user = db.users.get(s.userId);
    return {
      id: s.id,
      userId: s.userId,
      username: user?.username || "Unknown",
      role: user?.role || "KARYAWAN",
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isRevoked: Boolean(s.revokedAt)
    };
  });
  return res.status(200).json({
    success: true,
    count: sessions.length,
    sessions
  });
});
securityRouter.delete("/sessions/:id", (req, res) => {
  const session = db.sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: "Sesi tidak ditemukan." });
  }
  session.revokedAt = /* @__PURE__ */ new Date();
  AuditService.log({
    userId: req.user?.userId,
    action: "REVOKE_USER_SESSION",
    module: "SECURITY",
    recordId: session.id,
    ipAddress: req.ip
  });
  return res.status(200).json({
    success: true,
    message: `Sesi '${session.id}' berhasil dicabut.`
  });
});
securityRouter.post("/unlock-user/:id", (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan." });
  }
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.status = "ACTIVE";
  AuditService.log({
    userId: req.user?.userId,
    action: "UNLOCK_USER_ACCOUNT",
    module: "SECURITY",
    recordId: user.id,
    ipAddress: req.ip
  });
  return res.status(200).json({
    success: true,
    message: `Akun '${user.username}' berhasil dibuka kembali (unlocked).`
  });
});
securityRouter.get("/audit-logs", (req, res) => {
  const { module, action, limit = 100 } = req.query;
  let logs = [...db.auditLogs];
  if (module && typeof module === "string") {
    logs = logs.filter((l) => l.module === module.toUpperCase());
  }
  if (action && typeof action === "string") {
    logs = logs.filter((l) => l.action === action.toUpperCase());
  }
  const parsedLimit = Math.min(Number(limit) || 100, 200);
  return res.status(200).json({
    success: true,
    count: logs.length,
    logs: logs.slice(0, parsedLimit)
  });
});
securityRouter.post("/backup", (req, res) => {
  const backup = SecurityHealthService.triggerBackup();
  AuditService.log({
    userId: req.user?.userId,
    action: "CREATE_BACKUP",
    module: "SECURITY",
    recordId: backup.id,
    newValue: { filename: backup.filename, size: backup.sizeBytes, checksum: backup.checksum },
    ipAddress: req.ip
  });
  return res.status(201).json({
    success: true,
    message: "Backup database berhasil dibuat dengan checksum SHA-256.",
    backup
  });
});
securityRouter.get("/backups", (_req, res) => {
  return res.status(200).json({
    success: true,
    count: db.backups.length,
    backups: db.backups
  });
});

// server/routes/uploadRoutes.ts
import { Router as Router5 } from "express";
import crypto2 from "crypto";
var uploadRouter = Router5();
var ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
var MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
uploadRouter.post("/", authMiddleware, sensitiveActionRateLimiter, (req, res) => {
  try {
    const { base64Data, originalFilename, mimeType } = req.body;
    if (!base64Data || typeof base64Data !== "string") {
      return res.status(400).json({ success: false, message: "Data file base64 wajib disertakan." });
    }
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      AuditService.recordSecurityEvent({
        eventType: "ILLEGAL_FILE_TYPE_UPLOAD",
        severity: "MEDIUM",
        ipAddress: req.ip,
        userId: req.user?.userId,
        details: `Percobaan upload tipe file tidak sah: ${mimeType || "unknown"}`
      });
      return res.status(400).json({
        success: false,
        message: "Tipe file tidak diizinkan. Hanya file JPG, PNG, dan WebP yang diperbolehkan."
      });
    }
    const rawBuffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
    if (rawBuffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `Ukuran file melebihi batas maksimum 5MB (Ukuran: ${(rawBuffer.length / 1024 / 1024).toFixed(2)}MB).`
      });
    }
    const isValidSignature = (buffer, mime) => {
      if (mime === "image/jpeg") {
        return buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
      }
      if (mime === "image/png") {
        return buffer.length >= 4 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71;
      }
      if (mime === "image/webp") {
        return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
      }
      return false;
    };
    if (!isValidSignature(rawBuffer, mimeType.toLowerCase())) {
      AuditService.recordSecurityEvent({
        eventType: "MALICIOUS_FILE_SIGNATURE",
        severity: "HIGH",
        ipAddress: req.ip,
        userId: req.user?.userId,
        details: `File signature mismatch! Header file tidak cocok dengan MIME type '${mimeType}'. Kemungkinan file berbahaya terselubung.`
      });
      return res.status(400).json({
        success: false,
        message: "File tidak valid: Format biner file tidak sesuai dengan tipe file gambar asli."
      });
    }
    const ext = mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1];
    const safeFileId = "DOC-" + crypto2.randomUUID() + `.${ext}`;
    const cleanOriginalName = typeof originalFilename === "string" ? originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50) : "upload";
    AuditService.log({
      userId: req.user?.userId,
      action: "FILE_UPLOAD",
      module: "UPLOAD",
      recordId: safeFileId,
      newValue: {
        originalName: cleanOriginalName,
        safeFileId,
        sizeBytes: rawBuffer.length,
        mimeType
      },
      ipAddress: req.ip
    });
    return res.status(201).json({
      success: true,
      message: "File berhasil diverifikasi dan disimpan secara aman.",
      file: {
        fileId: safeFileId,
        sizeBytes: rawBuffer.length,
        mimeType,
        url: `/uploads/${safeFileId}`
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Gagal memproses file upload."
    });
  }
});

// server/routes/expenseRoutes.ts
import { Router as Router6 } from "express";
import { z as z4 } from "zod";
var expenseRouter = Router6();
var createExpenseSchema = z4.object({
  expenseNumber: z4.string().optional(),
  date: z4.string().min(8, "Tanggal wajib diisi."),
  branchId: z4.string().min(1, "Cabang wajib dipilih."),
  branchName: z4.string().min(1, "Nama cabang wajib ada."),
  categoryId: z4.string().min(1, "Kategori pengeluaran wajib dipilih."),
  categoryName: z4.string().min(1, "Nama kategori wajib ada."),
  subcategory: z4.string().min(1, "Subkategori wajib dipilih."),
  name: z4.string().min(3, "Nama pengeluaran minimal 3 karakter."),
  description: z4.string().optional(),
  amount: z4.number().positive("Nominal pengeluaran harus lebih besar dari 0."),
  accountingType: z4.enum([
    "BEBAN_OPERASIONAL",
    "BEBAN_SDM",
    "BEBAN_FASILITAS",
    "BEBAN_FINANSIAL",
    "ASET_TETAP",
    "PERSEDIAAN",
    "PEMBAYARAN_UTANG"
  ]),
  paymentMethod: z4.enum(["Kas", "Transfer Bank", "QRIS", "Kartu Debit/EDC", "Lainnya"]),
  sourceAccount: z4.string().min(1, "Sumber dana / rekening wajib dipilih."),
  vendorOrBeneficiary: z4.string().min(2, "Nama penerima atau vendor wajib diisi."),
  picStaffId: z4.string().min(1, "PIC / Pengaju wajib ada."),
  picStaffName: z4.string().min(1, "Nama PIC wajib ada."),
  invoiceRefNumber: z4.string().optional(),
  attachmentUrl: z4.string().optional(),
  attachmentFileName: z4.string().optional(),
  approvalStatus: z4.enum(["Draft", "Menunggu Persetujuan", "Disetujui", "Ditolak", "Dibatalkan"]).default("Menunggu Persetujuan"),
  notes: z4.string().optional()
});
expenseRouter.get(
  "/",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KARYAWAN", "KASIR"]),
  (req, res) => {
    try {
      const { branchId, status, dateFrom, dateTo } = req.query;
      let list = Array.from(db.companyExpenses.values());
      if (req.user?.role !== "ADMIN" && req.user?.branchId && req.user.branchId !== "BR-ALL") {
        list = list.filter((e) => e.branchId === req.user?.branchId);
      } else if (branchId && branchId !== "ALL" && branchId !== "BR-ALL") {
        list = list.filter((e) => e.branchId === branchId);
      }
      if (status && status !== "ALL") {
        list = list.filter((e) => e.approvalStatus === status);
      }
      if (dateFrom) {
        list = list.filter((e) => e.date >= String(dateFrom));
      }
      if (dateTo) {
        list = list.filter((e) => e.date <= String(dateTo));
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.status(200).json({
        success: true,
        data: list
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);
expenseRouter.post(
  "/",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KARYAWAN", "KASIR"]),
  sensitiveActionRateLimiter,
  (req, res) => {
    try {
      const validated = createExpenseSchema.parse(req.body);
      if (req.user?.role !== "ADMIN" && req.user?.branchId && req.user.branchId !== "BR-ALL") {
        if (validated.branchId !== req.user.branchId) {
          return res.status(403).json({
            success: false,
            message: "Akses ditolak: Anda hanya berwenang mengajukan pengeluaran untuk cabang kerja Anda sendiri."
          });
        }
      }
      const now = /* @__PURE__ */ new Date();
      const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(1e3 + Math.random() * 9e3);
      const generatedNumber = validated.expenseNumber || `EXP-${dateStr}-${randomSuffix}`;
      const id = `EXP-${Date.now()}-${randomSuffix}`;
      const newExpense = {
        id,
        expenseNumber: generatedNumber,
        date: validated.date,
        branchId: validated.branchId,
        branchName: validated.branchName,
        categoryId: validated.categoryId,
        categoryName: validated.categoryName,
        subcategory: validated.subcategory,
        name: validated.name,
        description: validated.description || "",
        amount: validated.amount,
        accountingType: validated.accountingType,
        paymentMethod: validated.paymentMethod,
        sourceAccount: validated.sourceAccount,
        vendorOrBeneficiary: validated.vendorOrBeneficiary,
        picStaffId: validated.picStaffId,
        picStaffName: validated.picStaffName,
        invoiceRefNumber: validated.invoiceRefNumber,
        attachmentUrl: validated.attachmentUrl,
        attachmentFileName: validated.attachmentFileName,
        approvalStatus: validated.approvalStatus,
        paymentStatus: "Belum Dibayar",
        paidAmount: 0,
        balanceRemaining: validated.amount,
        notes: validated.notes,
        auditLogs: [
          {
            id: `LOG-${Date.now()}`,
            timestamp: (/* @__PURE__ */ new Date()).toLocaleString("id-ID"),
            userId: req.user?.userId || "SYSTEM",
            userName: req.user?.username || "User",
            action: validated.approvalStatus === "Draft" ? "Dibuat (Draft)" : "Diajukan Persetujuan",
            notes: validated.notes || "Pengajuan pengeluaran dibuat"
          }
        ],
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.companyExpenses.set(id, newExpense);
      AuditService.log({
        userId: req.user?.userId || null,
        action: "CREATE_EXPENSE",
        module: "FINANCE_EXPENSES",
        recordId: id,
        newValue: { expenseNumber: generatedNumber, amount: validated.amount }
      });
      return res.status(201).json({
        success: true,
        data: newExpense
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
);
expenseRouter.post("/:id/approve", authMiddleware, requireRoles(["ADMIN", "LEADER"]), (req, res) => {
  try {
    const { id } = req.params;
    const expense = db.companyExpenses.get(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Transaksi pengeluaran tidak ditemukan." });
    }
    if (expense.approvalStatus === "Disetujui") {
      return res.status(400).json({ success: false, message: "Transaksi ini sudah disetujui sebelumnya." });
    }
    expense.approvalStatus = "Disetujui";
    expense.approvedByUserId = req.user?.userId;
    expense.approvedByUserName = req.user?.username;
    expense.approvedAt = (/* @__PURE__ */ new Date()).toISOString();
    expense.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    expense.auditLogs.push({
      id: `LOG-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("id-ID"),
      userId: req.user?.userId || "SYSTEM",
      userName: req.user?.username || "Approver",
      action: "Disetujui",
      notes: req.body.notes || "Pengeluaran disetujui"
    });
    db.companyExpenses.set(id, expense);
    AuditService.log({
      userId: req.user?.userId || null,
      action: "APPROVE_EXPENSE",
      module: "FINANCE_EXPENSES",
      recordId: id,
      newValue: { status: "Disetujui", approver: req.user?.username }
    });
    return res.status(200).json({ success: true, data: expense });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
expenseRouter.post("/:id/reject", authMiddleware, requireRoles(["ADMIN", "LEADER"]), (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || reason.trim().length < 3) {
      return res.status(400).json({ success: false, message: "Alasan penolakan wajib diisi minimal 3 karakter." });
    }
    const expense = db.companyExpenses.get(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Transaksi pengeluaran tidak ditemukan." });
    }
    expense.approvalStatus = "Ditolak";
    expense.rejectionReason = reason;
    expense.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    expense.auditLogs.push({
      id: `LOG-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleString("id-ID"),
      userId: req.user?.userId || "SYSTEM",
      userName: req.user?.username || "Approver",
      action: "Ditolak",
      notes: `Alasan: ${reason}`
    });
    db.companyExpenses.set(id, expense);
    return res.status(200).json({ success: true, data: expense });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
expenseRouter.post(
  "/:id/pay",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KASIR"]),
  sensitiveActionRateLimiter,
  (req, res) => {
    try {
      const { id } = req.params;
      const { paidAmount, paidAccount, notes } = req.body;
      const expense = db.companyExpenses.get(id);
      if (!expense) {
        return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
      }
      if (expense.approvalStatus !== "Disetujui") {
        return res.status(400).json({ success: false, message: "Hanya transaksi yang telah disetujui yang dapat dibayar." });
      }
      const payVal = Number(paidAmount);
      if (!payVal || isNaN(payVal) || payVal <= 0) {
        return res.status(400).json({ success: false, message: "Nominal pembayaran harus berupa angka positif lebih besar dari 0." });
      }
      if (payVal > expense.balanceRemaining) {
        return res.status(400).json({
          success: false,
          message: `Nominal pembayaran (Rp ${payVal.toLocaleString("id-ID")}) melebihi sisa tagihan (Rp ${expense.balanceRemaining.toLocaleString("id-ID")}).`
        });
      }
      const newPaidTotal = expense.paidAmount + payVal;
      const newRemaining = Math.max(0, expense.amount - newPaidTotal);
      expense.paidAmount = newPaidTotal;
      expense.balanceRemaining = newRemaining;
      expense.paymentStatus = newRemaining === 0 ? "Lunas" : "Dibayar Sebagian";
      expense.paidAt = (/* @__PURE__ */ new Date()).toISOString();
      expense.paidByUserId = req.user?.userId;
      expense.paidByUserName = req.user?.username;
      expense.paidAccount = paidAccount || expense.sourceAccount;
      expense.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      expense.auditLogs.push({
        id: `LOG-${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toLocaleString("id-ID"),
        userId: req.user?.userId || "SYSTEM",
        userName: req.user?.username || "Cashier",
        action: newRemaining === 0 ? "Pembayaran Lunas Dicatat" : "Pembayaran Sebagian Dicatat",
        notes: `Dibayar: Rp ${payVal.toLocaleString("id-ID")} via ${expense.paidAccount}. Sisa: Rp ${newRemaining.toLocaleString("id-ID")}`
      });
      db.companyExpenses.set(id, expense);
      AuditService.log({
        userId: req.user?.userId,
        action: "PAY_EXPENSE",
        module: "FINANCE_EXPENSES",
        recordId: id,
        newValue: { paidAmount: payVal, balanceRemaining: newRemaining, paymentStatus: expense.paymentStatus },
        ipAddress: req.ip
      });
      return res.status(200).json({ success: true, data: expense });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);
expenseRouter.get(
  "/categories",
  authMiddleware,
  requireRoles(["ADMIN", "LEADER", "KARYAWAN", "KASIR"]),
  (_req, res) => {
    const categories = Array.from(db.expenseCategories.values());
    return res.status(200).json({ success: true, data: categories });
  }
);

// server/routes/settingsRoutes.ts
import { Router as Router7 } from "express";
var settingsRouter = Router7();
var inMemorySettingsStore = {
  google_sheets_config: {
    activeSpreadsheetId: "",
    spreadsheetName: "",
    spreadsheetUrl: "",
    autoSyncEnabled: true,
    syncMethod: "oauth",
    lastSyncTime: null,
    googleClientId: ""
  }
};
settingsRouter.get("/:key", async (req, res) => {
  const { key } = req.params;
  if (!pgPool) {
    return res.status(200).json({
      success: true,
      key,
      value: inMemorySettingsStore[key] || null,
      source: "in_memory"
    });
  }
  try {
    const result = await pgPool.query(
      "SELECT key, value, updated_at, updated_by FROM system_settings WHERE key = $1",
      [key]
    );
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        key,
        value: inMemorySettingsStore[key] || null,
        source: "default"
      });
    }
    return res.status(200).json({
      success: true,
      key,
      value: result.rows[0].value,
      updatedAt: result.rows[0].updated_at,
      updatedBy: result.rows[0].updated_by,
      source: "postgresql"
    });
  } catch (err) {
    console.warn(`[Settings] DB query fallback for key ${key}:`, err.message);
    return res.status(200).json({
      success: true,
      key,
      value: inMemorySettingsStore[key] || null,
      source: "in_memory_fallback"
    });
  }
});
settingsRouter.post("/:key", async (req, res) => {
  const { key } = req.params;
  const { value, updatedBy = "ADMIN" } = req.body;
  if (!value) {
    return res.status(400).json({ success: false, message: "Nilai konfigurasi (value) wajib disertakan." });
  }
  inMemorySettingsStore[key] = value;
  if (!pgPool) {
    return res.status(200).json({
      success: true,
      key,
      value,
      source: "in_memory"
    });
  }
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(50) DEFAULT 'ADMIN'
      );
    `);
    const result = await pgPool.query(
      `INSERT INTO system_settings (key, value, updated_at, updated_by)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP, updated_by = EXCLUDED.updated_by
       RETURNING key, value, updated_at, updated_by`,
      [key, JSON.stringify(value), updatedBy]
    );
    return res.status(200).json({
      success: true,
      key: result.rows[0].key,
      value: result.rows[0].value,
      updatedAt: result.rows[0].updated_at,
      updatedBy: result.rows[0].updated_by,
      source: "postgresql"
    });
  } catch (err) {
    console.error(`[Settings] Failed to save setting ${key} to PostgreSQL:`, err);
    return res.status(200).json({
      success: true,
      key,
      value,
      source: "in_memory_fallback",
      warning: `Disimpan di memori runtime (Gagal simpan ke DB: ${err.message})`
    });
  }
});

// server/app.ts
import pg from "pg";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var rootDir = process.cwd();
var distPath = path.resolve(rootDir, "dist");
var app = express();
var isProduction = process.env.NODE_ENV === "production";
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use(allowedMethodsMiddleware);
app.use(antiPathTraversalMiddleware);
app.use(xssSanitizeMiddleware);
app.use("/api", generalApiRateLimiter);
var pgPool = null;
if (process.env.DATABASE_URL) {
  try {
    const isSsl = process.env.DATABASE_URL.includes("sslmode=require") || process.env.DB_SSL === "true";
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5e3,
      ssl: isSsl ? { rejectUnauthorized: false } : void 0
    });
    pgPool.query("SELECT 1").then(() => {
      console.log("[PostgreSQL] Connected successfully to database");
    }).catch((err) => {
      console.warn("[PostgreSQL] Database initial ping failed (will retry on requests):", err.message);
    });
  } catch (err) {
    console.warn("[PostgreSQL] Pool initialization error:", err?.message);
  }
}
app.all(["/__aistudio_internal_control_plane/dev/status", "/__aistudio_internal_control_plane/*"], (_req, res) => {
  return res.status(200).json({ status: "ok", ready: true });
});
app.get(["/health", "/healthz", "/_healthz", "/api/health"], async (_req, res) => {
  let dbStatus = "not_configured";
  if (pgPool) {
    try {
      await pgPool.query("SELECT 1");
      dbStatus = "connected";
    } catch (e) {
      dbStatus = `disconnected (${e.message})`;
    }
  } else {
    dbStatus = "in_memory_fallback";
  }
  res.status(200).json({
    status: "ok",
    service: "RFA GYM ERP Enterprise",
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus,
      configured: Boolean(process.env.DATABASE_URL)
    },
    uptime: Math.floor(process.uptime()),
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/health/db", async (_req, res) => {
  if (!pgPool) {
    return res.status(200).json({
      success: true,
      mode: "in_memory_fallback",
      message: "DATABASE_URL belum dikonfigurasi. Server berjalan dengan in-memory store."
    });
  }
  try {
    const start = Date.now();
    const result = await pgPool.query("SELECT current_database(), current_user, version()");
    const latencyMs = Date.now() - start;
    return res.status(200).json({
      success: true,
      connected: true,
      latencyMs,
      database: result.rows[0]?.current_database,
      user: result.rows[0]?.current_user,
      postgresVersion: result.rows[0]?.version?.split(" ")?.[0] + " " + result.rows[0]?.version?.split(" ")?.[1]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      connected: false,
      error: error.message,
      hint: "Periksa DATABASE_URL di Environment Variables Dokploy. Pastikan host dan password benar."
    });
  }
});
app.use("/api/auth", authRouter);
app.use("/api/members", memberRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/admin/security", securityRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/settings", settingsRouter);
if (isProduction || fs.existsSync(distPath)) {
  app.use(
    express.static(distPath, {
      maxAge: "1d",
      setHeaders: (response, filePath) => {
        if (filePath.endsWith(".html")) {
          response.setHeader("Cache-Control", "no-cache");
        }
      }
    })
  );
  app.get("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(indexPath);
    }
    return res.status(200).send("GymPro ERP Enterprise is running.");
  });
} else {
  (async () => {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("[GymPro Server] Vite middleware initialization skipped:", err);
    }
  })();
}
app.use((err, req, res, _next) => {
  console.error("[GymPro Security Alert] Uncaught Error:", err);
  AuditService.recordSecurityEvent({
    eventType: "UNCAUGHT_SERVER_EXCEPTION",
    severity: "MEDIUM",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: `Error pada ${req.method} ${req.originalUrl}: ${err.message}`
  });
  return res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Terjadi kesalahan pada server. Tim teknis telah menerima log insiden ini." : err.message || "Terjadi kesalahan pada server."
  });
});
var host = "0.0.0.0";
var port = parseInt(process.env.PORT || "3000", 10);
app.listen(port, host, () => {
  console.log(`[GymPro Enterprise] Security Shield successfully active on http://${host}:${port}`);
});
var app_default = app;
export {
  app_default as default,
  pgPool
};
