# Android APK for "Predaja vozil"

The APK is a small Android shell that opens your live app (the same GitHub Pages address, same Firebase accounts, same data). So it has every function the web app has, and when you edit `oprema.js` on GitHub, the APK shows the change too. You do **not** rebuild the APK for normal edits.

> I could not build or test the APK in my own environment (no Android tools, no internet there). GitHub builds it for you. The first run is the real test: if it fails, send me the error text from the red step.

## Step 1: Upload the files (about 3 minutes)

Unzip `predaja-vozil-apk.zip`. In your GitHub repository: **Add file → Upload files**, drag in **everything** from the unzipped folder (files and the folders `scripts`, `native`, `.github`), then **Commit changes**.

- `app.js` is the only existing file that gets replaced (small Android-only additions; the website behaves as before).
- The zip does **not** contain `config.js` or `oprema.js`, so your settings are not touched.
- If the `.github` folder does not appear after upload: **Add file → Create new file**, type the name `.github/workflows/build-apk.yml` (the slashes create the folders), paste the content of that file from the zip, commit.

## Step 2: Signing key (2 minutes, do this BEFORE the first build)

Android only installs an update over an existing app if both are signed with the same key. So that every future APK can update the old one:

1. Open `PRIVATE-signing-key.txt` (**never upload it to GitHub**, the repository is public).
2. Repository **Settings → Secrets and variables → Actions → New repository secret**. Create the two secrets named exactly as in that file (`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEYSTORE_BASE64`).
3. Keep the file somewhere safe.

If you skip this, the build still works but uses a throw-away key. Later builds then cannot update that install; colleagues would have to uninstall first.

## Step 3: Build the APK (5-10 minutes, no waiting at the screen)

Repository **Actions** tab → **Build Android APK** → **Run workflow** → green button. When it shows a green check, open the run: the summary has the download link. The same file is under **Releases** (tag `apk-latest`).

## Step 4: Install on a phone

Open the download link in Chrome on the phone, download `predaja-vozil.apk`, open it, and allow "install from this source" when Android asks. If Play Protect warns about an unknown app, choose **More details → Install anyway** (it is your own app). On the first QR scan Android asks for the camera: allow.

Send colleagues the link, or make a QR code of it.

## Things that differ from the website

- **First launch needs internet** once (like installing the web app). After that it works offline as before.
- **Print all QR codes** and **Download sticker** are not available inside the Android app (Android's web view cannot print or save those files). Print stickers from the website in a browser. The QR codes are the same either way.
- **Photos of damage**: the Android app has two buttons, "Posnemi fotografijo" (camera) and "Izberi iz galerije".
- Phone camera scanning a car's QR code opens the website in the browser, not the APK. The in-app **Skeniraj QR kodo** button opens the vehicle inside the APK.

## If something goes wrong

| Problem | What to do |
|---|---|
| Red X in Actions | Open the run, click the red step, copy the last ~30 lines and send them to me. |
| App shows "Ni povezave" screen | Phone has no internet at first launch. Connect and tap "Poskusi znova". |
| Login fails only in the APK | In Firebase → Project settings → API keys, check the key is not restricted to specific websites. |
| Using a custom domain later | Repository **Settings → Secrets and variables → Actions → Variables** → add `PUBLIC_URL` = `https://your-domain/`, then run the workflow again. |
