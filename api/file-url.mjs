import {
  requireUid,
  assertOwned,
  storageConfig,
  storageFetch,
  sendError,
  HttpError,
} from "./_verify.mjs";

/*
 * A year, in seconds. The bucket stays private and the app stores a signed URL
 * on the file document, which is the same shape Firebase Storage used before:
 * an address that works only because it carries an unguessable token. Keeping
 * the expiry long means opening a file is a plain link, not a round trip
 * through this function every time a folder is rendered.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const uid = await requireUid(req);
    const objectPath = assertOwned(uid, (req.body ?? {}).path);
    const { url, bucket } = storageConfig();

    const response = await storageFetch(
      `/object/sign/${bucket}/${encodeURI(objectPath)}`,
      {
        method: "POST",
        body: JSON.stringify({ expiresIn: SIGNED_URL_TTL_SECONDS }),
      }
    );

    if (!response.ok) {
      throw new HttpError(
        502,
        `Supabase refused to sign the download (${response.status})`
      );
    }

    const { signedURL } = await response.json();
    return res.status(200).json({ url: `${url}/storage/v1${signedURL}` });
  } catch (error) {
    return sendError(res, error);
  }
}
