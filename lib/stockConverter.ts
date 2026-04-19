/**
 * Stock Converter Utility
 * Converts raw input lines to processed stock data.
 */

const DIAMOND = "\u2666";
const BULLET = "\u2022";
const SPADE = "\u2660";

// Pre-compiled regex patterns (built from module-level constants)
const AKUNLAMA_CHECK_PATTERN = new RegExp(
  `^[^\\s${DIAMOND}]+@[^\\s${DIAMOND}]+${DIAMOND}[^\\s${BULLET}]+${BULLET}[^\\s#]+#[^\\s&]+&\\S+$`
);
const AKUNLAMA_PARSE_PATTERN = new RegExp(
  `^([^\\s${DIAMOND}]+@[^\\s${DIAMOND}]+)${DIAMOND}([^\\s${BULLET}]+)${BULLET}([^\\s#]+)#([^\\s&]+)&(\\S+)$`
);
const INSTAGRAM_PARSE_PATTERN = new RegExp(
  `^(.*?)${DIAMOND}(\\d+)\\s*\\*(\\d+)\\s*${SPADE}(\\S*)\\s*@(\\S+)\\s*=(\\S+)(?:\\s+(.*))?$`
);
const POST_PATTERN = new RegExp(`^(\\d+)${SPADE}`);

export interface ConvertedStock {
  email: string;
  username: string;
  password: string;
  sessionid: string;
  twoFALink?: string;
  rawContent: string;
}

function normalizeRawLineSymbols(line: string): string {
  return line.replaceAll("â™¦", DIAMOND).replaceAll("â€¢", BULLET).replaceAll("â™ ", SPADE);
}

/**
 * Process a single raw line and convert it to stock data.
 */
export function convertRawLine(line: string): ConvertedStock | null {
  const trimmedLine = line.trim();

  // Skip empty lines or comments
  if (!trimmedLine || trimmedLine.startsWith("//")) {
    return null;
  }

  const normalizedLine = normalizeRawLineSymbols(trimmedLine);

  // Priority 1: auth_token format
  if (normalizedLine.includes("auth_token=")) {
    return processAuthTokenFormat(normalizedLine);
  }

  // Priority 2: akunlama credential format
  if (isAkunlamaCredentialFormat(normalizedLine)) {
    return processAkunlamaCredentialFormat(normalizedLine);
  }

  // Priority 3: Instagram style format
  if (normalizedLine.includes(DIAMOND) && normalizedLine.includes("=")) {
    return processInstagramFormat(normalizedLine);
  }

  // Priority 4: fallback email processing
  return processFallbackFormat(normalizedLine);
}

function isAkunlamaCredentialFormat(line: string): boolean {
  return AKUNLAMA_CHECK_PATTERN.test(line);
}

/**
 * Format:
 * email@domain.com♦username•password#sessionid:token&2FASECRET
 *
 * Output:
 * email@domain.com
 * username: username
 * password:password
 * Link Autentikasi: 2fa.akunlama.com/?secret=2FASECRET
 */
function processAkunlamaCredentialFormat(line: string): ConvertedStock | null {
  const match = line.match(AKUNLAMA_PARSE_PATTERN);

  if (!match) {
    return null;
  }

  const email = match[1];
  const username = match[2];
  const password = match[3];
  const sessionid = match[4];
  const twoFASecret = match[5];
  const twoFALink = `2fa.akunlama.com/?secret=${twoFASecret}`;

  const rawContent = `${email}
username: ${username}
password:${password}
Link Autentikasi: ${twoFALink}`;

  return {
    email,
    username,
    password,
    sessionid,
    twoFALink,
    rawContent,
  };
}

/**
 * Process auth_token format.
 */
function processAuthTokenFormat(line: string): ConvertedStock | null {
  const emailMatch = line.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const email = emailMatch ? emailMatch[0] : null;

  if (!email) {
    return null;
  }

  const emailUsername = email.split("@")[0];
  const emailSuffix = emailUsername ? emailUsername.slice(-3) : null;
  const authTokenMatch = line.match(/auth_token=(\w+)/);
  const authToken = authTokenMatch ? authTokenMatch[1] : null;

  let username: string | null = null;
  if (line.includes("@")) {
    const allUserMatches = line.match(/@\S+/g);
    if (allUserMatches && allUserMatches.length > 0) {
      const domainPart = email.split("@")[1] || "";
      let candidate: string | null = null;
      for (const u of allUserMatches) {
        const uPart = u.replace("@", "");
        if (uPart !== domainPart) {
          candidate = uPart;
        }
      }
      username = candidate;
    }
  }

  const postMatch = line.match(POST_PATTERN);
  const post = postMatch ? postMatch[1] : "0";
  const followerMatch = line.match(/(\d+)~/);
  const follower = followerMatch ? followerMatch[1] : "0";
  const yearMatch = line.match(/~\s*(\d+)/);
  const year = yearMatch ? yearMatch[1] : "N/A";
  const password = emailSuffix ? `charming@${emailSuffix}` : "N/A";

  const rawContent = `${email}
password: ${password}
check email: https://akunlama.com/inbox/${emailUsername || "N/A"}
auth_token=${authToken || "N/A"}

Username${BULLET}Post${BULLET}Follower${BULLET}Tahun = ${username || "N/A"}${BULLET}${post || "N/A"}${BULLET}${follower || "N/A"}${BULLET}${year || "N/A"}`;

  return {
    email,
    username: username || emailUsername || "N/A",
    password,
    sessionid: `auth_token=${authToken || "N/A"}`,
    rawContent,
  };
}

/**
 * Process Instagram format.
 * Format: email_prefix♦post *follower ♠year @username =sessionid [password] [2FA:secret]
 */
function processInstagramFormat(line: string): ConvertedStock | null {
  const match = line.match(INSTAGRAM_PARSE_PATTERN);

  if (!match) {
    return null;
  }

  const rawUsername = match[1].trim();
  let year = match[4];
  if (!year || year.toLowerCase() === "nan") {
    year = "N/A";
  }
  const extractedUsername = match[5];
  const sessionid = match[6];
  const passwordSuffix = rawUsername.slice(-3);

  let password = `${passwordSuffix}@asem777`;
  let twoFASecret: string | null = null;

  if (match[7]) {
    const trimmed = match[7].trim();
    const twoFAIndex = trimmed.indexOf("2FA:");
    if (twoFAIndex !== -1) {
      const beforeTwoFA = trimmed.substring(0, twoFAIndex).trim();
      if (beforeTwoFA) {
        password = beforeTwoFA;
      }
      twoFASecret = trimmed.substring(twoFAIndex + 4).trim();
    } else {
      password = trimmed;
    }
  }

  const email = `${rawUsername}@akunlama.com`;

  let rawContent = `${email}
username: ${extractedUsername}
password:${password}
sessionid=${sessionid}
`;

  let twoFALink: string | undefined;
  if (twoFASecret) {
    twoFALink = `2fa.akunlama.com/?secret=${twoFASecret}`;
    rawContent += `Link Autentikasi: ${twoFALink}\n`;
  }

  return {
    email,
    username: extractedUsername,
    password,
    sessionid,
    twoFALink,
    rawContent: rawContent.trim(),
  };
}

/**
 * Fallback processing for other formats containing email.
 */
function processFallbackFormat(line: string): ConvertedStock | null {
  const emailMatch = line.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const email = emailMatch ? emailMatch[0] : null;

  if (!email) {
    return null;
  }

  const emailUsername = email.split("@")[0];
  const emailSuffix = emailUsername ? emailUsername.slice(-3) : null;
  const authTokenMatch = line.match(/auth_token=(\w+)/);
  const authToken = authTokenMatch ? authTokenMatch[1] : null;
  const usernameMatch = line.match(/@(\S+)/);
  const maybeUser = usernameMatch ? usernameMatch[1] : null;
  const postMatch = line.match(POST_PATTERN);
  const post = postMatch ? postMatch[1] : "0";
  const followerMatch = line.match(/(\d+)~/);
  const follower = followerMatch ? followerMatch[1] : "0";
  const yearMatch = line.match(/~\s*(\d+)/);
  const year = yearMatch ? yearMatch[1] : "N/A";
  const password = emailSuffix ? `charming@${emailSuffix}` : "N/A";
  const sessionidMatch = line.match(/sessionid=([\S]+)/);
  const sessionid = sessionidMatch ? sessionidMatch[1] : null;

  if (authToken) {
    const rawContent = `${email}
password: ${password}
check email: https://akunlama.com/inbox/${emailUsername || "N/A"}
auth_token=${authToken || "N/A"}

Username${BULLET}Post${BULLET}Follower${BULLET}Tahun = ${maybeUser || "N/A"}${BULLET}${post || "N/A"}${BULLET}${follower || "N/A"}${BULLET}${year || "N/A"}`;

    return {
      email,
      username: maybeUser || emailUsername || "N/A",
      password,
      sessionid: `auth_token=${authToken}`,
      rawContent,
    };
  }

  if (sessionid) {
    const rawContent = `${email}
username: ${maybeUser || "N/A"}
password: ${password}
sessionid=${sessionid}`;

    return {
      email,
      username: maybeUser || emailUsername || "N/A",
      password,
      sessionid,
      rawContent,
    };
  }

  return null;
}

/**
 * Convert multiple lines of raw input to array of processed stock data.
 */
export function convertBulkRawInput(rawInput: string): {
  converted: ConvertedStock[];
  errors: { line: number; content: string }[];
} {
  const lines = rawInput
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !l.startsWith("//"));
  const converted: ConvertedStock[] = [];
  const errors: { line: number; content: string }[] = [];

  lines.forEach((line, index) => {
    const result = convertRawLine(line);
    if (result) {
      converted.push(result);
    } else if (line.trim()) {
      errors.push({ line: index + 1, content: line });
    }
  });

  return { converted, errors };
}
