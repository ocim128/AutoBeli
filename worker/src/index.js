const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Api-Key",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...CORS_HEADERS,
    },
  });
}

function sanitizeHeader(value) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

function normalizeBody(value) {
  return String(value || "")
    .replace(/\r?\n/g, "\r\n")
    .trim();
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function getEmailDomain(address) {
  const normalized = String(address || "")
    .trim()
    .toLowerCase();
  const parts = normalized.split("@");

  if (parts.length !== 2) {
    return "";
  }

  return parts[1];
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim());
}

function extractApiKey(request) {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-api-key")?.trim() || "";
}

function getRequestSender(payload, env) {
  const envFromEmail = sanitizeHeader(env.DEFAULT_FROM_EMAIL);
  const envFromName = sanitizeHeader(env.DEFAULT_FROM_NAME || "AutoBeli");
  const envReplyTo = sanitizeHeader(env.DEFAULT_REPLY_TO);

  const requestFromEmail = sanitizeHeader(payload.fromEmail);
  const requestFromName = sanitizeHeader(payload.fromName);
  const requestReplyTo = sanitizeHeader(payload.replyTo);

  const fromEmail = requestFromEmail || envFromEmail;
  const fromName = requestFromName || envFromName;
  const replyTo = requestReplyTo || envReplyTo;

  return { fromEmail, fromName, replyTo };
}

function validateSender(fromEmail, env) {
  if (!fromEmail) {
    return "A sender email is required";
  }

  if (!isValidEmail(fromEmail)) {
    return "Sender email must be a valid email address";
  }

  const allowedDomains = parseCommaList(env.ALLOWED_FROM_DOMAINS);

  if (allowedDomains.length > 0 && !allowedDomains.includes(getEmailDomain(fromEmail))) {
    return `Sender domain is not allowed: ${getEmailDomain(fromEmail) || "unknown"}`;
  }

  return null;
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error || "Unknown error");
}

function safeEqual(a, b) {
  const aValue = String(a || "");
  const bValue = String(b || "");
  const maxLength = Math.max(aValue.length, bValue.length);
  let result = aValue.length === bValue.length ? 0 : 1;

  for (let i = 0; i < maxLength; i++) {
    const left = i < aValue.length ? aValue.charCodeAt(i) : 0;
    const right = i < bValue.length ? bValue.charCodeAt(i) : 0;
    result |= left ^ right;
  }

  return result === 0;
}

async function handleSendEmail(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const expectedApiKey = env.OUTBOUND_EMAIL_API_KEY;
  const providedApiKey = extractApiKey(request);

  if (!expectedApiKey || !safeEqual(providedApiKey, expectedApiKey)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!env.OUTBOUND_EMAIL) {
    return jsonResponse({ error: "Send email binding is not configured" }, 500);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const to = sanitizeHeader(payload.to).toLowerCase();
  const subject = sanitizeHeader(payload.subject);
  const text = normalizeBody(payload.text);
  const { fromEmail, fromName, replyTo } = getRequestSender(payload, env);

  if (!isValidEmail(to)) {
    return jsonResponse({ error: "Valid recipient email is required" }, 400);
  }

  if (!subject) {
    return jsonResponse({ error: "Subject is required" }, 400);
  }

  if (!text) {
    return jsonResponse({ error: "Text body is required" }, 400);
  }

  const senderValidationError = validateSender(fromEmail, env);

  if (senderValidationError) {
    return jsonResponse({ error: senderValidationError }, 400);
  }

  if (replyTo && !isValidEmail(replyTo)) {
    return jsonResponse({ error: "Reply-to email must be a valid email address" }, 400);
  }

  try {
    const result = await env.OUTBOUND_EMAIL.send({
      to,
      from: {
        email: fromEmail,
        name: fromName || "AutoBeli",
      },
      subject,
      text,
      ...(replyTo
        ? {
            replyTo: {
              email: replyTo,
              name: fromName || "AutoBeli",
            },
          }
        : {}),
    });

    return jsonResponse({
      success: true,
      provider: "cloudflare-email",
      messageId: result?.messageId || null,
      to,
      from: fromEmail,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const errorCode =
      error && typeof error === "object" && "code" in error ? String(error.code) : null;

    console.error("[AutoBeli Worker] Failed to send outbound email:", {
      code: errorCode,
      message: errorMessage,
    });

    return jsonResponse(
      {
        error: `Failed to send email: ${errorMessage}`,
        code: errorCode,
      },
      500
    );
  }
}

function handleHealth(env) {
  return jsonResponse({
    ok: true,
    service: "autobeli-outbound-email",
    configured: {
      sendBinding: Boolean(env.OUTBOUND_EMAIL),
    },
  });
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/api/health")) {
      return handleHealth(env);
    }

    if (url.pathname === "/api/outbound/purchase" || url.pathname === "/api/send") {
      return handleSendEmail(request, env);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};

export default worker;
