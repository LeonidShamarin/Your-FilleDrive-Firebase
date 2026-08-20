import {
  requireUid,
  assertOwned,
  storageConfig,
  storageFetch,
  sendError,
} from "./_verify.mjs";

/*
 * Removing the stored object. A 404 from Supabase is not an error worth
 * surfacing: the caller is deleting the file document either way, and an object
 * that is already gone is the state we wanted.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const objectPath = assertOwned(uid, (req.body ?? {}).path);
    const { bucket } = storageConfig();

    const response = await storageFetch(
      `/object/${bucket}/${encodeURI(objectPath)}`,
      { method: "DELETE" }
    );

    return res
      .status(200)
      .json({ removed: response.ok, status: response.status });
  } catch (error) {
    return sendError(res, error);
  }
}
