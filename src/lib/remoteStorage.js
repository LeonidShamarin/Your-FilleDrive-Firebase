import { auth } from "../firebase";

/*
 * Files live in Supabase Storage, in a private bucket the browser has no key
 * for. Every operation goes through a Vercel function that verifies the
 * Firebase ID token and does the privileged part with the service-role key.
 * Auth and the folder tree stay on Firebase; only the bytes moved.
 */
async function authedPost(endpoint, body) {
  const user = auth.currentUser;
  if (!user) throw new Error("You are not signed in");

  const token = await user.getIdToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error ?? `Request failed with ${response.status}`);
  }
  return response.json();
}

export function requestUploadUrl(path) {
  return authedPost("/api/upload-url", { path });
}

export function requestFileUrl(path) {
  return authedPost("/api/file-url", { path });
}

export function removeStoredFile(path) {
  return authedPost("/api/delete-file", { path });
}

/**
 * Sends the file to the signed URL.
 *
 * This is XMLHttpRequest rather than fetch on purpose: fetch reports no upload
 * progress, and the progress bar in the upload card is the whole point of
 * showing one.
 */
export function putWithProgress(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl);
    // Re-uploading the same name into the same folder replaces the object,
    // matching what the file document does with its url.
    request.setRequestHeader("x-upsert", "true");
    if (file.type) request.setRequestHeader("Content-Type", file.type);

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Upload failed with ${request.status}`));
    });
    request.addEventListener("error", () =>
      reject(new Error("Upload failed — network error"))
    );
    request.addEventListener("abort", () =>
      reject(new Error("Upload cancelled"))
    );

    request.send(file);
  });
}
