/*
 * Reports what the functions can see of their server-side configuration —
 * values only where the value is already public, the Supabase key as a boolean.
 * Without this, a missing or wrong variable surfaces as an opaque 500 and the
 * only way to tell the cases apart is guessing.
 */
export default function handler(req, res) {
  res.status(200).json({
    // The value, not a boolean: this id is public — it ships in the client
    // bundle — and a mismatch with the project that issued the token is the
    // failure this endpoint exists to make visible.
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "(unset)",
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_BUCKET: process.env.SUPABASE_BUCKET ?? "(unset, defaults to files)",
  });
}
