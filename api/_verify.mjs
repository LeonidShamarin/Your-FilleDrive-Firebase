import { createRemoteJWKSet, jwtVerify } from "jose";

/*
 * Firebase ID tokens are RS256, signed by Google. Verifying them needs only the
 * project id and Google's public keys — no service-account secret — so nothing
 * private about Firebase has to live in this project's environment.
 *
 * createRemoteJWKSet caches the key set and refreshes it on rotation, so this
 * is one fetch per cold start rather than one per request.
 */
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Verifies the caller's Firebase ID token and returns their uid. */
export async function requireUid(req) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new HttpError(500, "FIREBASE_PROJECT_ID is not set");

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new HttpError(401, "Missing bearer token");

  let payload;
  try {
    ({ payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    }));
  } catch {
    throw new HttpError(401, "Invalid token");
  }

  const uid = payload.user_id ?? payload.sub;
  if (!uid) throw new HttpError(401, "Token carries no uid");
  return uid;
}

/**
 * Builds the object path for a caller. Everything a user owns lives under their
 * own uid, and that prefix is added here rather than trusted from the client —
 * otherwise anyone could ask for a URL pointing into somebody else's folder.
 */
export function scopedPath(uid, relativePath) {
  const clean = String(relativePath ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");

  if (!clean) throw new HttpError(400, "Empty file path");
  return `${uid}/${clean}`;
}

/** Rejects a path that does not belong to the caller. */
export function assertOwned(uid, path) {
  if (typeof path !== "string" || !path.startsWith(`${uid}/`)) {
    throw new HttpError(403, "That file belongs to someone else");
  }
  return path;
}

export function storageConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET ?? "files";
  if (!url || !key) {
    throw new HttpError(500, "Supabase environment variables are not set");
  }
  return { url: url.replace(/\/+$/, ""), key, bucket };
}

/** Service-role calls to Supabase Storage's REST API. */
export async function storageFetch(path, init = {}) {
  const { url, key } = storageConfig();
  const response = await fetch(`${url}/storage/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  return response;
}

export function sendError(res, error) {
  const status = error instanceof HttpError ? error.status : 500;
  if (status === 500) console.error(error);
  res.status(status).json({
    error: status === 500 ? "Server error" : error.message,
  });
}
