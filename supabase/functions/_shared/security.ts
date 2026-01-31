/**
 * ============================================================================
 * SECURITY MODULE - OWASP Best Practices Implementation
 * ============================================================================
 * 
 * This module provides:
 * 1. Rate limiting (IP-based + User-based)
 * 2. Input validation & sanitization
 * 3. Secure request handling
 * 
 * OWASP References:
 * - A01:2021 Broken Access Control
 * - A03:2021 Injection
 * - A04:2021 Insecure Design
 * - A05:2021 Security Misconfiguration
 */

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * In-memory rate limit store with automatic cleanup
 * Note: For production with multiple instances, use Redis or similar
 */
interface RateLimitEntry {
  count: number;
  windowStart: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries older than 1 hour
    if (now - entry.windowStart > 3600000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Rate limit configuration
 * Sensible defaults based on OWASP recommendations
 */
export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  blockDurationMs: number; // How long to block after limit exceeded
}

// Default rate limits by endpoint type
export const RATE_LIMITS = {
  // AI endpoints - expensive, need strict limits
  ai: {
    windowMs: 60000,       // 1 minute
    maxRequests: 10,       // 10 requests per minute
    blockDurationMs: 60000 // Block for 1 minute
  },
  // Auth endpoints - strict to prevent brute force
  auth: {
    windowMs: 900000,      // 15 minutes
    maxRequests: 5,        // 5 attempts per 15 minutes
    blockDurationMs: 900000 // Block for 15 minutes
  },
  // Standard endpoints
  standard: {
    windowMs: 60000,       // 1 minute
    maxRequests: 30,       // 30 requests per minute
    blockDurationMs: 60000 // Block for 1 minute
  },
  // Webhook endpoints (more lenient for automated systems)
  webhook: {
    windowMs: 60000,       // 1 minute
    maxRequests: 100,      // 100 requests per minute
    blockDurationMs: 30000 // Block for 30 seconds
  }
} as const;

/**
 * Extract client identifier for rate limiting
 * Uses X-Forwarded-For header (set by reverse proxy) or falls back to connection info
 */
export function getClientIdentifier(req: Request, userId?: string): string {
  // Prefer user ID for authenticated requests (more accurate)
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP from X-Forwarded-For header (standard for proxied requests)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take first IP in chain (original client)
    const ip = forwardedFor.split(",")[0].trim();
    return `ip:${ip}`;
  }
  
  // Fallback to X-Real-IP header
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }
  
  // Last resort: use a hash of request characteristics
  const userAgent = req.headers.get("user-agent") || "unknown";
  return `anon:${hashString(userAgent)}`;
}

/**
 * Simple string hash for fallback identification
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Check and update rate limit for a client
 * Returns null if allowed, or an error response if rate limited
 */
export function checkRateLimit(
  req: Request,
  config: RateLimitConfig,
  userId?: string,
  corsHeaders: Record<string, string> = {}
): Response | null {
  const clientId = getClientIdentifier(req, userId);
  const now = Date.now();
  
  let entry = rateLimitStore.get(clientId);
  
  // Check if currently blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
    console.warn(`Rate limit: Client ${clientId} is blocked for ${retryAfter}s`);
    
    return new Response(
      JSON.stringify({
        error: "Trop de requêtes. Veuillez réessayer plus tard.",
        retryAfter
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(entry.blockedUntil / 1000).toString()
        }
      }
    );
  }
  
  // Initialize or reset window
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = { count: 1, windowStart: now };
    rateLimitStore.set(clientId, entry);
    return null;
  }
  
  // Increment counter
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    entry.blockedUntil = now + config.blockDurationMs;
    rateLimitStore.set(clientId, entry);
    
    const retryAfter = Math.ceil(config.blockDurationMs / 1000);
    console.warn(`Rate limit exceeded: Client ${clientId} blocked for ${retryAfter}s`);
    
    return new Response(
      JSON.stringify({
        error: "Limite de requêtes atteinte. Veuillez patienter.",
        retryAfter
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": Math.ceil(entry.blockedUntil / 1000).toString()
        }
      }
    );
  }
  
  rateLimitStore.set(clientId, entry);
  return null;
}

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Maximum allowed lengths for common input types
 * Based on realistic use cases and OWASP recommendations
 */
export const MAX_LENGTHS = {
  email: 255,
  password: 128,
  name: 100,
  subject: 100,
  message: 10000,
  textContent: 100000,    // ~100KB of text
  imageBase64: 20971520,  // ~20MB in base64 (for large images)
  pdfBase64: 70000000,    // ~50MB PDF in base64
  url: 2048,
  json: 1000000,          // 1MB JSON
  uuid: 36,
  filename: 255,
} as const;

/**
 * Validate and sanitize a string input
 * Returns sanitized value or null if invalid
 */
export function sanitizeString(
  value: unknown,
  maxLength: number,
  fieldName: string,
  options: {
    required?: boolean;
    allowNewlines?: boolean;
    allowHtml?: boolean;
    pattern?: RegExp;
    minLength?: number;
  } = {}
): { value: string | null; error: string | null } {
  // Check if value is provided
  if (value === undefined || value === null || value === "") {
    if (options.required) {
      return { value: null, error: `${fieldName} est requis` };
    }
    return { value: null, error: null };
  }
  
  // Type check
  if (typeof value !== "string") {
    return { value: null, error: `${fieldName} doit être une chaîne de caractères` };
  }
  
  // Length validation
  if (value.length > maxLength) {
    return { value: null, error: `${fieldName} est trop long (max ${maxLength} caractères)` };
  }
  
  if (options.minLength && value.length < options.minLength) {
    return { value: null, error: `${fieldName} est trop court (min ${options.minLength} caractères)` };
  }
  
  // Pattern validation
  if (options.pattern && !options.pattern.test(value)) {
    return { value: null, error: `${fieldName} contient des caractères invalides` };
  }
  
  let sanitized = value;
  
  // Strip newlines unless explicitly allowed
  if (!options.allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, " ");
  }
  
  // Strip HTML unless explicitly allowed (prevent XSS)
  if (!options.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Remove null bytes and other control characters (prevent injection)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  
  return { value: sanitized, error: null };
}

/**
 * Validate email format
 */
export function validateEmail(email: unknown): { value: string | null; error: string | null } {
  const { value, error } = sanitizeString(email, MAX_LENGTHS.email, "Email", { required: true });
  if (error) return { value: null, error };
  
  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(value!)) {
    return { value: null, error: "Format d'email invalide" };
  }
  
  return { value: value!.toLowerCase(), error: null };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: unknown, fieldName = "ID"): { value: string | null; error: string | null } {
  const { value, error } = sanitizeString(uuid, MAX_LENGTHS.uuid, fieldName, { required: true });
  if (error) return { value: null, error };
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(value!)) {
    return { value: null, error: `${fieldName} format invalide` };
  }
  
  return { value: value!.toLowerCase(), error: null };
}

/**
 * Validate number within range
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; required?: boolean; integer?: boolean } = {}
): { value: number | null; error: string | null } {
  if (value === undefined || value === null) {
    if (options.required) {
      return { value: null, error: `${fieldName} est requis` };
    }
    return { value: null, error: null };
  }
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  
  if (typeof num !== "number" || isNaN(num)) {
    return { value: null, error: `${fieldName} doit être un nombre` };
  }
  
  if (options.integer && !Number.isInteger(num)) {
    return { value: null, error: `${fieldName} doit être un entier` };
  }
  
  if (options.min !== undefined && num < options.min) {
    return { value: null, error: `${fieldName} doit être au moins ${options.min}` };
  }
  
  if (options.max !== undefined && num > options.max) {
    return { value: null, error: `${fieldName} doit être au maximum ${options.max}` };
  }
  
  return { value: num, error: null };
}

/**
 * Validate array with item validation
 */
export function validateArray<T>(
  value: unknown,
  fieldName: string,
  itemValidator: (item: unknown, index: number) => { value: T | null; error: string | null },
  options: { required?: boolean; minLength?: number; maxLength?: number } = {}
): { value: T[] | null; error: string | null } {
  if (value === undefined || value === null) {
    if (options.required) {
      return { value: null, error: `${fieldName} est requis` };
    }
    return { value: null, error: null };
  }
  
  if (!Array.isArray(value)) {
    return { value: null, error: `${fieldName} doit être un tableau` };
  }
  
  if (options.minLength !== undefined && value.length < options.minLength) {
    return { value: null, error: `${fieldName} doit contenir au moins ${options.minLength} élément(s)` };
  }
  
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    return { value: null, error: `${fieldName} peut contenir au maximum ${options.maxLength} élément(s)` };
  }
  
  const result: T[] = [];
  for (let i = 0; i < value.length; i++) {
    const { value: itemValue, error } = itemValidator(value[i], i);
    if (error) {
      return { value: null, error: `${fieldName}[${i}]: ${error}` };
    }
    if (itemValue !== null) {
      result.push(itemValue);
    }
  }
  
  return { value: result, error: null };
}

/**
 * Validate base64 data URL (for images/PDFs)
 */
export function validateBase64DataUrl(
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    maxSize?: number;
    allowedMimeTypes?: string[];
  } = {}
): { value: string | null; error: string | null; mimeType?: string } {
  if (value === undefined || value === null || value === "") {
    if (options.required) {
      return { value: null, error: `${fieldName} est requis` };
    }
    return { value: null, error: null };
  }
  
  if (typeof value !== "string") {
    return { value: null, error: `${fieldName} doit être une chaîne base64` };
  }
  
  // Check size
  const maxSize = options.maxSize || MAX_LENGTHS.imageBase64;
  if (value.length > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    return { value: null, error: `${fieldName} est trop volumineux (max ~${maxMB}MB)` };
  }
  
  // Parse data URL
  const dataUrlMatch = value.match(/^data:([^;,]+)(?:;base64)?,/);
  if (!dataUrlMatch) {
    // If it's raw base64 without prefix, that's OK
    return { value, error: null };
  }
  
  const mimeType = dataUrlMatch[1];
  
  // Validate MIME type if specified
  if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
    return { value: null, error: `Type de fichier non autorisé: ${mimeType}` };
  }
  
  return { value, error: null, mimeType };
}

/**
 * Validate content type for generation
 */
export function validateContentType(
  value: unknown
): { value: "flashcards" | "quiz" | "synthesis" | "comic" | null; error: string | null } {
  const validTypes = ["flashcards", "quiz", "synthesis", "comic"];
  
  if (!value || typeof value !== "string" || !validTypes.includes(value)) {
    return { value: null, error: "Type de contenu invalide" };
  }
  
  return { value: value as "flashcards" | "quiz" | "synthesis" | "comic", error: null };
}

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Reject requests with unexpected fields (prevent parameter pollution)
 */
export function rejectUnexpectedFields(
  body: Record<string, unknown>,
  allowedFields: string[],
  corsHeaders: Record<string, string> = {}
): Response | null {
  const unexpected = Object.keys(body).filter(key => !allowedFields.includes(key));
  
  if (unexpected.length > 0) {
    console.warn(`Unexpected fields in request: ${unexpected.join(", ")}`);
    // Don't reveal field names to potential attackers
    return new Response(
      JSON.stringify({ error: "Requête invalide" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  return null;
}

/**
 * Safe JSON parse with size limit
 */
export async function safeParseJSON(
  req: Request,
  maxSize: number = MAX_LENGTHS.json,
  corsHeaders: Record<string, string> = {}
): Promise<{ body: Record<string, unknown> | null; error: Response | null }> {
  // Check content length header
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > maxSize) {
    return {
      body: null,
      error: new Response(
        JSON.stringify({ error: "Requête trop volumineuse" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
  
  try {
    const text = await req.text();
    
    // Double-check actual size
    if (text.length > maxSize) {
      return {
        body: null,
        error: new Response(
          JSON.stringify({ error: "Requête trop volumineuse" }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      };
    }
    
    const body = JSON.parse(text);
    
    // Ensure it's an object
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return {
        body: null,
        error: new Response(
          JSON.stringify({ error: "Corps de requête invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      };
    }
    
    return { body, error: null };
  } catch {
    return {
      body: null,
      error: new Response(
        JSON.stringify({ error: "JSON invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    };
  }
}

/**
 * Create standardized error response
 */
export function errorResponse(
  status: number,
  message: string,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Create standardized success response
 */
export function successResponse(
  data: unknown,
  corsHeaders: Record<string, string> = {}
): Response {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
