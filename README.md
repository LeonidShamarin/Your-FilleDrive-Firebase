# Your File Drive

A private file drive in the browser: sign in with an email address, upload
files, and organise them in folders that can be nested as deeply as you like.
Everything a user stores is scoped to their own account.

**Live:** https://shamarin-your-filledrive.vercel.app

Built with React 18 and Firebase (Authentication, Cloud Firestore, Cloud
Storage). No backend of its own — the browser talks to Firebase directly, and
Firebase security rules are what actually separate one user's files from
another's.

---

## What it does

**Accounts**
- Sign up, log in, log out (Firebase email/password).
- Password reset by email.
- Change the account email or password from the profile screen.
- Every route except the auth screens is behind `PrivateRoute`; the app waits
  for Firebase to restore the session before deciding to redirect, so a page
  refresh does not bounce a signed-in user to the login screen.

**Files and folders**
- Create folders inside folders; breadcrumbs show the full path back to the
  root and every level in it is clickable.
- Upload one or several files at once, with a progress bar per file and a
  visible error state when an upload fails.
- Uploading a file whose name already exists in the same folder replaces that
  file instead of creating a duplicate.
- Images render as thumbnails; other types get an icon chosen by extension
  (PDF, text, archive, generic).
- Delete a file, or delete a folder together with everything inside it —
  subfolders and stored objects included. Both ask for confirmation first.

---

## How it works

Two Firestore collections, no server code:

| Collection | Fields |
|---|---|
| `folders` | `name`, `parentId` (`null` at the root), `userId`, `path` (ancestor `{id, name}` objects, root excluded), `createdAt` |
| `files` | `name`, `url` (Storage download URL), `folderId`, `userId`, `createdAt` |

Uploaded objects live in Storage under `files/{uid}/{folder path}/{file name}`.

`src/hooks/useFolder.js` is the centre of the app: it resolves the folder from
the URL, then keeps two `onSnapshot` listeners open — one for child folders, one
for child files — so anything created, renamed or deleted appears without a
reload.

Deleting a folder has to be done client-side (Firestore has no recursive delete
for web clients), so `DeleteFolder.js` walks the subtree breadth-first. That
walk is bounded on purpose: **20 levels deep and 500 items**, with a `visited`
set, so a broken `parentId` chain cannot turn it into an endless loop. Past
those limits the dialog asks you to delete some contents first rather than
silently doing half the job.

### Where files are stored

Firebase covers authentication and Firestore, both of which stay on the no-cost
Spark plan. It does **not** store the files: since February 2025 Cloud Storage
requires the Blaze plan, and a Spark project loses access to its bucket, so
every upload came back as `storage/quota-exceeded`.

Files live in a **private Supabase Storage bucket** instead, reached through
three serverless functions in `api/`:

```
browser --- POST /api/upload-url  (Firebase ID token) ---> verify token
                                                           sign upload URL
        <-- { uploadUrl, path } ------------------------------------------
        --- PUT the file straight to Supabase ---------------------------->
        --- POST /api/file-url ---> signed URL, valid a year
Firestore <-- { name, path, url, folderId, userId }
```

The service-role key stays in the functions; the browser never sees it and
never talks to Supabase with any credential of its own. The object path is
built server-side as `<uid>/<folders>/<name>` from the **verified** token, so a
caller cannot aim an upload at another account's space, and `/api/file-url` and
`/api/delete-file` refuse any path that does not start with the caller's uid.

Token verification uses `jose` against Google's public keys and needs only the
project id — no Firebase service-account secret lives in this project.

Because the API lives in `api/`, `npm start` alone serves the app without those
endpoints; use `vercel dev` to run both.

### Project structure

```
src/
  components/
    authentication/   Login, Signup, ForgotPassword, Profile, UpdateProfile, PrivateRoute
    google-drive/     Dashboard, Navbar, Folder, File, breadcrumbs, add/delete buttons
    ui/               ConfirmModal — the confirmation dialog for destructive actions
  context/AuthContext.js   every call into Firebase Auth lives here
  hooks/useFolder.js       folder resolution + live child listeners
  firebase.js              SDK setup, exports auth / database / storage
  index.css                design tokens and all app styling
```

---

## Running it locally

Requires **Node 22** (the version the deployment builds with).

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm start
```

`.env.local` holds the Firebase web config. These values are not secrets — they
ship inside the client bundle by design — but they are kept out of the repo so
the app can be pointed at a different Firebase project without editing code:

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

### Firebase project setup

1. **Authentication** → enable the *Email/Password* provider.
2. **Firestore** → create the database, then add a composite index for each
   collection (the console offers the exact link the first time a query fails):
   - `folders`: `userId` ASC, `parentId` ASC, `createdAt` ASC
   - `files`: `userId` ASC, `folderId` ASC, `createdAt` ASC
3. **Storage** → create the default bucket.
4. **Rules.** The `where("userId", "==", uid)` filters in the code are for
   fetching the right documents, not for security — without rules anyone could
   read everything. Minimum viable set:

   ```javascript
   // Firestore
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{collection}/{docId} {
         allow read, delete: if request.auth != null
           && resource.data.userId == request.auth.uid;
         allow create, update: if request.auth != null
           && request.resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

   ```javascript
   // Storage
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /files/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null
           && request.auth.uid == userId;
       }
     }
   }
   ```

---

## Deployment

Deployed on Vercel with the Create React App preset — build `npm run build`,
output `build/`, SPA routing handled by the preset. The six `REACT_APP_*`
variables are set in the project's environment variables; adding or changing one
only takes effect after a redeploy.

The Node version is pinned in `package.json` (`engines.node: 22.x`) rather than
in the Vercel dashboard, so it travels with the repository instead of living in
a UI setting that quietly goes stale.

---

## Known limits

- **A file link works without signing in.** The bucket is private, but the URL
  stored on a file document is a signed one valid for a year — anyone holding it
  can open that file. This is deliberate: it keeps opening a file a plain link
  rather than a round trip through the API on every render. A shared link is a
  shared file.
- **Files uploaded before the move to Supabase are unreachable.** Their
  documents carry a dead Firebase URL and no `path`, so the app cannot fetch or
  delete the object; deleting such a file removes the document only.
- **No sharing, renaming or moving.** Files and folders can only be created and
  deleted; there is no way to move an item between folders.
- **Folder deletion is capped** at 20 levels / 500 items per operation, and it
  is not a transaction: if it fails halfway, whatever was already removed stays
  removed.
- **No file size or type validation** in the client — the practical limit is
  whatever the Storage rules and the free tier allow.
- **Create React App is no longer maintained upstream.** The build works and is
  pinned to Node 22; a move to Vite is the obvious next step if this project
  gets developed further.
