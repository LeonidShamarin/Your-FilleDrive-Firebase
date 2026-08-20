# Your File Drive

A private file drive in the browser: sign in with an email address, upload
files, and organise them in folders that can be nested as deeply as you like.
Everything a user stores is scoped to their own account.

**Live:** https://shamarin-your-filledrive.vercel.app

Built with React 18. Firebase covers accounts and the folder tree
(Authentication + Cloud Firestore), and Firebase security rules are what
actually separate one user's documents from another's. The files themselves live
in a private Supabase Storage bucket, reached through three small serverless
functions — Cloud Storage left Firebase's no-cost plan in February 2025, and
this project stays free without a billing card.

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

Two Firestore collections, plus three functions in `api/` that exist only to
hold the storage credential:

| Collection | Fields |
|---|---|
| `folders` | `name`, `parentId` (`null` at the root), `userId`, `path` (ancestor `{id, name}` objects, root excluded), `createdAt` |
| `files` | `name`, `path` (object path in the bucket), `url` (signed link, valid a year), `folderId`, `userId`, `createdAt` |

Uploaded objects live in the Supabase bucket under
`{uid}/{folder path}/{file name}`.

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
  lib/remoteStorage.js     the three API calls, and the upload with progress
  firebase.js              SDK setup, exports auth / database
  index.css                design tokens and all app styling
api/
  _verify.mjs              token verification, path scoping, Supabase helpers
  upload-url.mjs           signs a one-shot upload URL
  file-url.mjs             signs a download link for a file you own
  delete-file.mjs          removes the stored object
  health.mjs               which server-side variables the functions can see
```

---

## Running it locally

Requires **Node 22** (the version the deployment builds with).

```bash
npm install
cp .env.example .env.local   # then fill in the values
npx vercel dev              # not `npm start` — see below
```

**Use `vercel dev`, not `npm start`.** The dev server alone serves the app
without `api/`, so every upload fails with a 404 that looks like an application
bug.

`.env.example` lists two groups of variables. The `REACT_APP_*` ones are the
Firebase web config: not secrets — they ship inside the client bundle by
design — but kept out of the repo so the app can be pointed at another Firebase
project without editing code.

```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```

The rest are read only by the functions and never reach the browser:

```
FIREBASE_PROJECT_ID=        # the SAME project as REACT_APP_FIREBASE_PROJECT_ID
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=  # full access to the bucket — treat as a password
SUPABASE_BUCKET=files
```

`FIREBASE_PROJECT_ID` must name the project the client signs in against. Point
it at a different project of the same account and every upload fails with
`Invalid token` while everything else looks correct — `/api/health` prints the
value the functions actually see, for exactly this case.

Put real values in `.env.local`, never in `.env.example`: the example file is
tracked, and a key pasted there is a key on its way into the repository.

### Firebase project setup

1. **Authentication** → enable the *Email/Password* provider.
2. **Firestore** → create the database, then add a composite index for each
   collection (the console offers the exact link the first time a query fails):
   - `folders`: `userId` ASC, `parentId` ASC, `createdAt` ASC
   - `files`: `userId` ASC, `folderId` ASC, `createdAt` ASC
3. **Rules.** The `where("userId", "==", uid)` filters in the code are for
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

Firebase Storage needs no setup at all here — the project does not use it.

### Supabase project setup

1. Create a project; its ref is the `<project-ref>` in `SUPABASE_URL`.
2. Create a **private** bucket named `files` (Storage → New bucket, *Public*
   off). Nothing else is needed: no policies, because every request is made by
   the functions with the service-role key, and no client ever talks to Supabase
   with a credential of its own.
3. Copy the **service_role** key from Settings → API into
   `SUPABASE_SERVICE_ROLE_KEY`. It bypasses row-level security, so it belongs in
   the functions' environment and nowhere near the client.

---

## Deployment

Deployed on Vercel with the Create React App preset — build `npm run build`,
output `build/`, SPA routing handled by the preset, and the functions in `api/`
picked up automatically. All nine variables above are set in the project's
environment variables; adding or changing one **only takes effect after a
redeploy**, which is worth remembering because the app keeps running with the
old value until then.

`GET /api/health` reports what the deployed functions can see — the Firebase
project id as a value (it is public anyway) and the Supabase key as a boolean.

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
- **No file size or type validation in the client.** The bucket rejects
  anything over **50 MB** and the free tier gives 1 GB in total, but the app
  finds out only when the upload fails — it does not check before sending.
- **Create React App is no longer maintained upstream.** The build works and is
  pinned to Node 22; a move to Vite is the obvious next step if this project
  gets developed further.
