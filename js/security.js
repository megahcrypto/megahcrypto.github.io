// ========================================
// SECURITY.JS - KONFIGURASI KEAMANAN
// ========================================

/**
 * Konfigurasi konstanta keamanan
 * Semua nilai dipilih dengan cermat untuk menyeimbangkan keamanan dan kemudahan penggunaan
 */
const SECURITY_CONFIG = {
  // Batas panjang input
  MAX_INPUT_LENGTH: {
    TOKEN_NAME: 30,
    TOKEN_SYMBOL: 10,
    TOKEN_DESCRIPTION: 100,
    WALLET_ADDRESS: 42,
  },

  // Pembatasan rate
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 10,
    REQUESTS_PER_HOUR: 60,
    TIMEOUT: 60000, // 1 menit dalam milidetik
    BLOCK_DURATION: 300000, // 5 menit dalam milidetik
  },

  // Pola validasi
  VALIDATION: {
    // Nama token: huruf, angka, spasi, max 30 karakter
    TOKEN_NAME_REGEX: /^[a-zA-Z0-9\s]{1,30}$/,

    // Simbol token: huruf kapital dan angka, 2-10 karakter
    TOKEN_SYMBOL_REGEX: /^[A-Z0-9]{2,10}$/,

    // Alamat Ethereum: 0x diikuti 40 karakter hex
    WALLET_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,

    // Desimal: 0-18
    DECIMALS_RANGE: { min: 0, max: 18 },

    // Supply: 1 hingga 1 triliun
    SUPPLY_MIN: 1,
    SUPPLY_MAX: 1000000000000,

    // Pola URL untuk keamanan
    URL_REGEX: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  },

  // Content Security Policy - PERBAIKAN
  CSP: {
    // Sumber yang diizinkan untuk script
    SCRIPT_SOURCES: [
      "'self'",
      "'unsafe-inline'",
      "https://cdn.jsdelivr.net",
      "https://cdnjs.cloudflare.com",
    ],
    // Sumber yang diizinkan untuk style
    STYLE_SOURCES: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
    ],
    // Sumber yang diizinkan untuk gambar
    IMAGE_SOURCES: ["'self'", "https://megahcrypto.github.io", "data:"],
    // Sumber yang diizinkan untuk font
    FONT_SOURCES: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
    ],
    // Sumber yang diizinkan untuk koneksi - DITAMBAHKAN
    CONNECT_SOURCES: [
      "'self'",
      "https://*.binance.org",
      "https://rpc.coredao.org",
      "https://seed-richechain.com",
      "https://*.alchemy.com",
      "wss://*.binance.org",
      "https://cdnjs.cloudflare.com",
    ],
  },

  // Aturan sanitasi
  SANITIZE: {
    ALLOWED_TAGS: [
      "strong",
      "em",
      "b",
      "i",
      "u",
      "p",
      "br",
      "span",
      "div",
      "a",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "code",
      "pre",
    ],
    ALLOWED_ATTRIBUTES: {
      a: ["href", "target", "rel"],
      span: ["class", "style"],
      div: ["class", "style"],
      p: ["class"],
      strong: ["class"],
      em: ["class"],
    },
    ALLOWED_URI_SCHEMES: ["http", "https", "mailto"],
  },

  // Header keamanan
  HEADERS: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  },

  // Perlindungan bot
  BOT_PROTECTION: {
    ENABLED: true,
    MINIMUM_TIME_ON_PAGE: 3000,
    MAXIMUM_FORM_SUBMISSIONS: 5,
  },
};

// ========================================
// KELAS ERROR KHUSUS
// ========================================
class SecurityError extends Error {
  constructor(message, code, field = null) {
    super(message);
    this.name = "SecurityError";
    this.code = code;
    this.field = field;
    this.timestamp = new Date().toISOString();
    this.severity = this.getSeverity(code);
  }

  getSeverity(code) {
    const highSeverity = [
      "XSS_ATTEMPT",
      "SQL_INJECTION",
      "CSRF_ATTEMPT",
      "RATE_LIMIT_EXCEEDED",
    ];
    const mediumSeverity = ["INVALID_NAME", "INVALID_SYMBOL", "INVALID_SUPPLY"];
    const lowSeverity = ["EMPTY_NAME", "EMPTY_SYMBOL", "DECIMALS_OUT_OF_RANGE"];

    if (highSeverity.includes(code)) return "TINGGI";
    if (mediumSeverity.includes(code)) return "SEDANG";
    if (lowSeverity.includes(code)) return "RENDAH";
    return "TIDAK DIKETAHUI";
  }
}

// ========================================
// VALIDATOR INPUT
// ========================================
class InputValidator {
  /**
   * Sanitasi input string untuk mencegah serangan XSS
   * @param {string} input - Input mentah dari pengguna
   * @returns {string} Input yang sudah disanitasi
   */
  static sanitizeInput(input) {
    if (typeof input !== "string") return "";
    // Hapus spasi di awal/akhir dan sanitasi dengan DOMPurify
    const trimmed = input.trim();
    try {
      return DOMPurify.sanitize(trimmed, {
        ALLOWED_TAGS: SECURITY_CONFIG.SANITIZE.ALLOWED_TAGS,
        ALLOWED_ATTR: SECURITY_CONFIG.SANITIZE.ALLOWED_ATTRIBUTES,
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?!:))/i,
        IN_PLACE: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        RETURN_DOM_IMPORT: false,
        SANITIZE_DOM: true,
        KEEP_CONTENT: false,
      });
    } catch (e) {
      // Fallback jika DOMPurify error
      console.warn("Sanitasi DOMPurify gagal, menggunakan fallback:", e);
      return trimmed.replace(/[<>]/g, "");
    }
  }

  /**
   * Validasi nama token
   * @param {string} name - Input nama token
   * @returns {string} Nama token yang divalidasi
   * @throws {SecurityError} Jika validasi gagal
   */
  static validateTokenName(name) {
    const sanitized = this.sanitizeInput(name);

    if (!sanitized || sanitized.length === 0) {
      throw new SecurityError(
        "Nama token tidak boleh kosong",
        "EMPTY_NAME",
        "tokenName",
      );
    }

    if (sanitized.length > SECURITY_CONFIG.MAX_INPUT_LENGTH.TOKEN_NAME) {
      throw new SecurityError(
        `Nama token tidak boleh melebihi ${SECURITY_CONFIG.MAX_INPUT_LENGTH.TOKEN_NAME} karakter`,
        "INVALID_NAME",
        "tokenName",
      );
    }

    if (!SECURITY_CONFIG.VALIDATION.TOKEN_NAME_REGEX.test(sanitized)) {
      throw new SecurityError(
        "Nama token hanya boleh berisi huruf, angka, dan spasi",
        "INVALID_NAME",
        "tokenName",
      );
    }

    // Periksa pola XSS potensial
    if (this.hasXSSPattern(sanitized)) {
      throw new SecurityError(
        "Karakter tidak valid terdeteksi di nama token",
        "XSS_ATTEMPT",
        "tokenName",
      );
    }

    return sanitized;
  }

  /**
   * Validasi simbol token
   * @param {string} symbol - Input simbol token
   * @returns {string} Simbol token yang divalidasi (huruf kapital)
   * @throws {SecurityError} Jika validasi gagal
   */
  static validateTokenSymbol(symbol) {
    const sanitized = this.sanitizeInput(symbol);
    const upperSymbol = sanitized.toUpperCase();

    if (!upperSymbol || upperSymbol.length === 0) {
      throw new SecurityError(
        "Simbol token tidak boleh kosong",
        "EMPTY_SYMBOL",
        "tokenSymbol",
      );
    }

    if (upperSymbol.length > SECURITY_CONFIG.MAX_INPUT_LENGTH.TOKEN_SYMBOL) {
      throw new SecurityError(
        `Simbol token tidak boleh melebihi ${SECURITY_CONFIG.MAX_INPUT_LENGTH.TOKEN_SYMBOL} karakter`,
        "INVALID_SYMBOL",
        "tokenSymbol",
      );
    }

    if (!SECURITY_CONFIG.VALIDATION.TOKEN_SYMBOL_REGEX.test(upperSymbol)) {
      throw new SecurityError(
        "Simbol token hanya boleh berisi huruf kapital dan angka (2-10 karakter)",
        "INVALID_SYMBOL",
        "tokenSymbol",
      );
    }

    // Periksa simbol yang dilindungi
    const reservedSymbols = [
      "ETH",
      "BTC",
      "BNB",
      "USDT",
      "USDC",
      "DAI",
      "SOL",
      "MATIC",
    ];
    if (reservedSymbols.includes(upperSymbol)) {
      throw new SecurityError(
        `Simbol token "${upperSymbol}" dilindungi. Silakan pilih simbol yang berbeda`,
        "RESERVED_SYMBOL",
        "tokenSymbol",
      );
    }

    return upperSymbol;
  }

  /**
   * Validasi desimal token
   * @param {string|number} decimals - Input jumlah desimal
   * @returns {number} Desimal yang divalidasi
   * @throws {SecurityError} Jika validasi gagal
   */
  static validateDecimals(decimals) {
    const dec = parseInt(decimals);

    if (isNaN(dec) || !isFinite(dec)) {
      throw new SecurityError(
        "Desimal harus berupa angka yang valid",
        "INVALID_DECIMALS",
        "tokenDecimals",
      );
    }

    if (
      dec < SECURITY_CONFIG.VALIDATION.DECIMALS_RANGE.min ||
      dec > SECURITY_CONFIG.VALIDATION.DECIMALS_RANGE.max
    ) {
      throw new SecurityError(
        `Desimal harus antara ${SECURITY_CONFIG.VALIDATION.DECIMALS_RANGE.min} dan ${SECURITY_CONFIG.VALIDATION.DECIMALS_RANGE.max}`,
        "DECIMALS_OUT_OF_RANGE",
        "tokenDecimals",
      );
    }

    // Periksa apakah integer aman
    if (!Number.isSafeInteger(dec)) {
      throw new SecurityError(
        "Nilai desimal tidak valid",
        "INVALID_DECIMALS",
        "tokenDecimals",
      );
    }

    return dec;
  }

  /**
   * Validasi supply token
   * @param {string|number} supply - Input total supply
   * @returns {bigint} Supply yang divalidasi sebagai BigInt
   * @throws {SecurityError} Jika validasi gagal
   */
  static validateSupply(supply) {
    // Hapus format (koma, spasi)
    const cleanSupply = String(supply).replace(/[,\s]/g, "");

    if (!cleanSupply || cleanSupply.length === 0) {
      throw new SecurityError(
        "Total supply tidak boleh kosong",
        "INVALID_SUPPLY",
        "tokenSupply",
      );
    }

    // Periksa apakah angka valid
    if (!/^\d+$/.test(cleanSupply)) {
      throw new SecurityError(
        "Total supply harus berupa angka yang valid",
        "INVALID_SUPPLY",
        "tokenSupply",
      );
    }

    const sup = BigInt(cleanSupply);

    if (sup < SECURITY_CONFIG.VALIDATION.SUPPLY_MIN) {
      throw new SecurityError(
        `Total supply minimal ${SECURITY_CONFIG.VALIDATION.SUPPLY_MIN}`,
        "SUPPLY_TOO_SMALL",
        "tokenSupply",
      );
    }

    if (sup > SECURITY_CONFIG.VALIDATION.SUPPLY_MAX) {
      throw new SecurityError(
        `Maksimal total supply adalah ${SECURITY_CONFIG.VALIDATION.SUPPLY_MAX.toLocaleString()}`,
        "SUPPLY_TOO_LARGE",
        "tokenSupply",
      );
    }

    return sup;
  }

  /**
   * Validasi alamat wallet
   * @param {string} address - Input alamat wallet
   * @returns {string} Alamat wallet yang divalidasi
   * @throws {SecurityError} Jika validasi gagal
   */
  static validateWalletAddress(address) {
    const sanitized = this.sanitizeInput(address);

    if (!sanitized || sanitized.length === 0) {
      throw new SecurityError(
        "Alamat wallet tidak boleh kosong",
        "EMPTY_ADDRESS",
        "walletAddress",
      );
    }

    if (!SECURITY_CONFIG.VALIDATION.WALLET_ADDRESS_REGEX.test(sanitized)) {
      throw new SecurityError(
        "Format alamat wallet tidak valid. Harus berupa alamat Ethereum yang valid dimulai dengan 0x",
        "INVALID_ADDRESS",
        "walletAddress",
      );
    }

    return sanitized;
  }

  /**
   * Periksa pola XSS dalam input
   * @param {string} input - String input yang diperiksa
   * @returns {boolean} True jika pola XSS terdeteksi
   */
  static hasXSSPattern(input) {
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onclick=/i,
      /onerror=/i,
      /onmouseover=/i,
      /onfocus=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /data:text\/html/i,
      /vbscript:/i,
      /expression\(/i,
      /alert\(/i,
      /eval\(/i,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Validasi URL
   * @param {string} url - URL yang divalidasi
   * @returns {boolean} True jika URL valid
   */
  static isValidURL(url) {
    if (!url) return false;
    return SECURITY_CONFIG.VALIDATION.URL_REGEX.test(url);
  }

  /**
   * Sanitasi dan validasi semua input form
   * @param {Object} formData - Objek data form
   * @returns {Object} Data form yang divalidasi
   * @throws {SecurityError} Jika ada validasi yang gagal
   */
  static validateFormInputs(formData) {
    const validated = {};

    if (formData.tokenName) {
      validated.tokenName = this.validateTokenName(formData.tokenName);
    }

    if (formData.tokenSymbol) {
      validated.tokenSymbol = this.validateTokenSymbol(formData.tokenSymbol);
    }

    if (formData.tokenDecimals !== undefined) {
      validated.tokenDecimals = this.validateDecimals(formData.tokenDecimals);
    }

    if (formData.tokenSupply !== undefined) {
      validated.tokenSupply = this.validateSupply(formData.tokenSupply);
    }

    return validated;
  }
}

// ========================================
// PEMBATAS RATE
// ========================================
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.blockedUsers = new Map();
  }

  /**
   * Periksa apakah pengguna telah melebihi batas rate
   * @param {string} identifier - Identifikasi pengguna (alamat wallet atau IP)
   * @returns {boolean} True jika permintaan diizinkan
   * @throws {SecurityError} Jika batas rate terlampaui
   */
  checkLimit(identifier) {
    if (!identifier) {
      throw new SecurityError(
        "Identifikasi pengguna hilang",
        "RATE_LIMIT_ERROR",
        null,
      );
    }

    // Periksa apakah pengguna diblokir
    if (this.isUserBlocked(identifier)) {
      throw new SecurityError(
        "Pengguna diblokir sementara karena terlalu banyak permintaan",
        "USER_BLOCKED",
        null,
      );
    }

    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Filter permintaan dalam satu menit terakhir
    const recentRequests = userRequests.filter(
      (time) => now - time < SECURITY_CONFIG.RATE_LIMIT.TIMEOUT,
    );

    // Periksa batas per menit
    if (
      recentRequests.length >= SECURITY_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE
    ) {
      this.blockUser(identifier);
      throw new SecurityError(
        `Batas rate terlampaui. Maksimal ${SECURITY_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE} permintaan per menit`,
        "RATE_LIMIT_EXCEEDED",
        null,
      );
    }

    // Periksa batas per jam (perkiraan dengan menghitung jendela 60 menit)
    const hourlyRequests = userRequests.filter((time) => now - time < 3600000);
    if (hourlyRequests.length >= SECURITY_CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR) {
      throw new SecurityError(
        `Batas rate terlampaui. Maksimal ${SECURITY_CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR} permintaan per jam`,
        "RATE_LIMIT_EXCEEDED",
        null,
      );
    }

    // Tambahkan permintaan saat ini
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);

    return true;
  }

  /**
   * Blokir pengguna karena permintaan berlebihan
   * @param {string} identifier - Identifikasi pengguna
   */
  blockUser(identifier) {
    const blockUntil = Date.now() + SECURITY_CONFIG.RATE_LIMIT.BLOCK_DURATION;
    this.blockedUsers.set(identifier, blockUntil);

    console.warn(
      "Pengguna diblokir: " +
        identifier +
        " sampai " +
        new Date(blockUntil).toISOString(),
    );
  }

  /**
   * Periksa apakah pengguna sedang diblokir
   * @param {string} identifier - Identifikasi pengguna
   * @returns {boolean} True jika pengguna diblokir
   */
  isUserBlocked(identifier) {
    const blockUntil = this.blockedUsers.get(identifier);
    if (!blockUntil) return false;

    if (Date.now() > blockUntil) {
      this.blockedUsers.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Dapatkan sisa waktu blokir untuk pengguna
   * @param {string} identifier - Identifikasi pengguna
   * @returns {number} Sisa waktu blokir dalam milidetik
   */
  getBlockRemaining(identifier) {
    const blockUntil = this.blockedUsers.get(identifier);
    if (!blockUntil) return 0;

    const remaining = blockUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Reset batas rate untuk pengguna
   * @param {string} identifier - Identifikasi pengguna
   */
  resetLimits(identifier) {
    this.requests.delete(identifier);
    this.blockedUsers.delete(identifier);
  }

  /**
   * Bersihkan entri yang kadaluarsa
   */
  cleanup() {
    const now = Date.now();

    // Bersihkan catatan permintaan
    for (const [identifier, times] of this.requests.entries()) {
      const validTimes = times.filter((time) => now - time < 3600000);
      if (validTimes.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimes);
      }
    }

    // Bersihkan pengguna yang diblokir
    for (const [identifier, blockUntil] of this.blockedUsers.entries()) {
      if (now > blockUntil) {
        this.blockedUsers.delete(identifier);
      }
    }
  }
}

// ========================================
// MANAJER HEADER KEAMANAN - PERBAIKAN CSP
// ========================================
class SecurityHeaders {
  /**
   * Terapkan header keamanan ke permintaan fetch
   * @param {Object} options - Opsi fetch
   * @returns {Object} Opsi fetch dengan header keamanan
   */
  static applyHeaders(options = {}) {
    const headers = {
      ...options.headers,
      "X-Content-Type-Options":
        SECURITY_CONFIG.HEADERS["X-Content-Type-Options"],
      "X-Frame-Options": SECURITY_CONFIG.HEADERS["X-Frame-Options"],
      "X-XSS-Protection": SECURITY_CONFIG.HEADERS["X-XSS-Protection"],
      "Referrer-Policy": SECURITY_CONFIG.HEADERS["Referrer-Policy"],
    };

    return { ...options, headers };
  }

  /**
   * Generate nilai header Content Security Policy
   * @returns {string} Nilai header CSP
   */
  static generateCSP() {
    const scriptSrc = SECURITY_CONFIG.CSP.SCRIPT_SOURCES.join(" ");
    const styleSrc = SECURITY_CONFIG.CSP.STYLE_SOURCES.join(" ");
    const imgSrc = SECURITY_CONFIG.CSP.IMAGE_SOURCES.join(" ");
    const fontSrc = SECURITY_CONFIG.CSP.FONT_SOURCES.join(" ");
    const connectSrc = SECURITY_CONFIG.CSP.CONNECT_SOURCES.join(" ");

    return (
      "default-src 'self'; script-src " +
      scriptSrc +
      "; style-src " +
      styleSrc +
      "; img-src " +
      imgSrc +
      "; font-src " +
      fontSrc +
      "; connect-src " +
      connectSrc +
      ";"
    );
  }

  /**
   * Terapkan meta tag CSP ke halaman
   */
  static applyCSP() {
    try {
      const meta = document.createElement("meta");
      meta.httpEquiv = "Content-Security-Policy";
      meta.content = this.generateCSP();
      document.head.appendChild(meta);
      console.log("Content Security Policy berhasil diterapkan");
    } catch (error) {
      console.warn(
        "Gagal menerapkan CSP, menggunakan kebijakan fallback:",
        error,
      );

      const meta = document.createElement("meta");
      meta.httpEquiv = "Content-Security-Policy";
      meta.content =
        "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://megahcrypto.github.io; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.binance.org https://rpc.coredao.org https://seed-richechain.com https://*.alchemy.com wss://*.binance.org https://cdnjs.cloudflare.com;";
      document.head.appendChild(meta);
      console.log("Fallback CSP diterapkan");
    }
  }
}

// ========================================
// PERLINDUNGAN BOT
// ========================================
class BotProtection {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.pageLoadTime = Date.now();
    this.formSubmissions = 0;
  }

  /**
   * Generate ID sesi unik
   * @returns {string} ID sesi
   */
  generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9)
    );
  }

  /**
   * Periksa apakah sesi saat ini valid
   * @returns {boolean} True jika sesi valid
   */
  isValidSession() {
    const timeOnPage = Date.now() - this.pageLoadTime;
    return timeOnPage >= SECURITY_CONFIG.BOT_PROTECTION.MINIMUM_TIME_ON_PAGE;
  }

  /**
   * Periksa apakah pengiriman form diizinkan
   * @returns {boolean} True jika pengiriman diizinkan
   * @throws {SecurityError} Jika pengiriman diblokir
   */
  checkFormSubmission() {
    if (!this.isValidSession()) {
      throw new SecurityError(
        "Harap tunggu beberapa saat sebelum mengirim",
        "TOO_FAST",
        null,
      );
    }

    if (
      this.formSubmissions >=
      SECURITY_CONFIG.BOT_PROTECTION.MAXIMUM_FORM_SUBMISSIONS
    ) {
      throw new SecurityError(
        "Batas maksimum pengiriman form terlampaui. Silakan refresh halaman.",
        "MAX_SUBMISSIONS",
        null,
      );
    }

    this.formSubmissions++;
    return true;
  }

  /**
   * Reset counter pengiriman form
   */
  resetSubmissions() {
    this.formSubmissions = 0;
  }
}

// ========================================
// LOGGER AUDIT
// ========================================
class AuditLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
  }

  /**
   * Catat event keamanan
   * @param {string} event - Jenis event
   * @param {string} level - Tingkat keparahan
   * @param {Object} data - Data event
   */
  log(event, level = "INFO", data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: event,
      level: level,
      data: data,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logs.push(logEntry);

    // Potong log jika terlalu besar
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log ke console dalam pengembangan
    if (process.env.NODE_ENV !== "production") {
      console.log("[" + level + "] " + event + ":", data);
    }

    // Kirim ke server jika kritis
    if (level === "KRITIS") {
      this.sendToServer(logEntry);
    }
  }

  /**
   * Kirim log ke server (untuk monitoring)
   * @param {Object} logEntry - Entri log
   */
  sendToServer(logEntry) {
    try {
      const data = JSON.stringify(logEntry);
      navigator.sendBeacon("/api/security/log", data);
    } catch (error) {
      console.warn("Gagal mengirim log keamanan:", error);
    }
  }

  /**
   * Dapatkan semua log
   * @returns {Array} Array entri log
   */
  getLogs() {
    return this.logs;
  }
}

// ========================================
// BUAT INSTANCE GLOBAL
// ========================================
const rateLimiter = new RateLimiter();
const botProtection = new BotProtection();
const auditLogger = new AuditLogger();

// ========================================
// EKSPOR KONFIGURASI UNTUK DIGUNAKAN DI MAIN.JS
// ========================================
window.SECURITY_CONFIG = SECURITY_CONFIG;
window.SecurityError = SecurityError;
window.InputValidator = InputValidator;
window.RateLimiter = RateLimiter;
window.SecurityHeaders = SecurityHeaders;
window.BotProtection = BotProtection;
window.AuditLogger = AuditLogger;

// Buat instance global untuk digunakan
window.rateLimiter = rateLimiter;
window.botProtection = botProtection;
window.auditLogger = auditLogger;

// ========================================
// TERAPKAN HEADER KEAMANAN - PERBAIKAN
// ========================================
// Terapkan header keamanan dengan penanganan error
try {
  SecurityHeaders.applyCSP();
  console.log("Header keamanan berhasil diterapkan");
} catch (error) {
  console.warn("Gagal menerapkan header keamanan:", error);
  // Fallback: terapkan CSP minimal
  try {
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content =
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' https://*.binance.org https://rpc.coredao.org https://seed-richechain.com https://*.alchemy.com wss://*.binance.org;";
    document.head.appendChild(meta);
    console.log("Fallback CSP minimal diterapkan");
  } catch (e) {
    console.warn("Tidak dapat menerapkan CSP apapun:", e);
  }
}

// Pembersihan rate limiter setiap jam
setInterval(function () {
  rateLimiter.cleanup();
}, 3600000);

// ========================================
// LOG KONSOLE UNTUK DEBUGGING
// ========================================
console.log("Modul Keamanan Dimuat");
console.log(
  "Rate Limiter: " +
    SECURITY_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE +
    " permintaan/menit",
);
console.log(
  "Perlindungan Bot: " +
    (SECURITY_CONFIG.BOT_PROTECTION.ENABLED ? "Aktif" : "Nonaktif"),
);
console.log("Audit Logger: Aktif (" + auditLogger.maxLogs + " maks log)");
console.log("ID Sesi: " + botProtection.sessionId);
console.log(
  "Kebijakan CSP: Diterapkan dengan pengaturan permisif untuk kompatibilitas",
);
