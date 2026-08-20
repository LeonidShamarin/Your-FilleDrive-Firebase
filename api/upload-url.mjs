import {
  requireUid,
  scopedPath,
  storageConfig,
  storageFetch,
  sendError,
  HttpError,
} from "./_verify.mjs";

/*
 * Hands the browser a one-shot signed URL to PUT a file to. The service-role
 * key never leaves this function, and the object path is derived from the
 * verified uid, so a caller cannot write outside their own space.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const { path } = req.body ?? {};
    const objectPath = scopedPath(uid, path);
    const { url, bucket } = storageConfig();

    const response = await storageFetch(
      `/object/upload/sign/${bucket}/${encodeURI(objectPath)}`,
      { method: "POST", body: JSON.stringify({}) }
    );

    if (!response.ok) {
      throw new HttpError(
        502,
        `Supabase refused to sign the upload (${response.status})`
      );
    }

    const { url: signedPath } = await response.json();
    return res.status(200).json({
      // Supabase returns a path; the browser needs the whole address.
      uploadUrl: `${url}/storage/v1${signedPath}`,
      path: objectPath,
    });
  } catch (error) {
    return sendError(res, error);
  }
}
