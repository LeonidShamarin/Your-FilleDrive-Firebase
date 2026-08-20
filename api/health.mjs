/*
 * Reports which server-side variables the functions can see. Booleans only —
 * never a value, not even a prefix. Without this, a missing variable surfaces
 * as an opaque 500 and the only way to tell them apart is guessing.
 */
export default function handler(req, res) {
  res.status(200).json({
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_BUCKET: process.env.SUPABASE_BUCKET ?? "(unset, defaults to files)",
  });
}
