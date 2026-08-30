# Play Console first-time setup

The Play package name is already set. Nothing needed to rename.

**Locked identity for the first upload**

| Field | Value |
|---|---|
| Package name | `com.botgamer4real.arcade` |
| On-device name | BotGamers Arcade |
| versionCode / versionName | `2` / `1.0.1` |
| Signed bundle | `android/app/build/outputs/bundle/release/app-release.aab` |
| Privacy policy | https://botgamers-arcade.vercel.app/privacy |

That package is in Capacitor, Gradle, Java, the debug APK on your Pixel, and the signed AAB. The first AAB you upload to Play **locks** `com.botgamer4real.arcade` forever on this listing. Do not change it after that.

This has to be done in the browser while signed into the verified Play developer account.

---

## 1. Open Console and create the app

1. Go to [https://play.google.com/console](https://play.google.com/console) and sign in with the verified account.
2. If it still asks for remaining account tasks (payments profile, contact email), finish those first. A **payments profile** is still needed even for a free app.
3. **Create app**
   - App name: `BotGamers Arcade`
   - Default language: English (United Kingdom)
   - App or game: **Game**
   - Free
   - Tick that it meets the Developer Programme Policies and US export laws

You should land on the app dashboard with a **Set up your app** checklist. Work that list top to bottom. Closed testing will stay blocked until the required items are green.

---

## 2. Store presence (users see this)

**Grow users → Store presence → Main store listing**

- Title: `BotGamers Arcade`
- Short description:
  ```
  Five original arcade games. Snake, Chase, Blocks, Swarm, and Brick.
  ```
- Full description: copy from `docs/PLAY-CONSOLE.md`
- App icon: `public/icon-512.png` (512×512)
- Feature graphic: 1024×500. Use `public/branding/botgamers-logo.jpg` cropped/resized if you do not have a banner yet
- Phone screenshots: at least 2 from the Pixel, 16:9 or 9:16. Arcade menu + one in-game (Snake is fine)

**Store settings**

- App category: **Game → Arcade**
- Email: your public support email
- Privacy policy: `https://botgamers-arcade.vercel.app/privacy`  
  Play will refuse testing without this URL.

---

## 3. Policy / App content (required before testing)

Under **Policy and programmes → App content**, fill every form. For this app:

| Form | What to choose |
|---|---|
| Privacy policy | Same URL as above |
| Ads | **No** |
| App access | All functionality available without special login. Sign-in is optional |
| Ads (declaration) | No ads |
| Content ratings | Start questionnaire → **Game** → IARC. Mild arcade, no violence beyond cartoon, no user chat |
| Target audience | **Everyone** / 3+ (or the closest “not designed for children” / mixed if it asks about kids). There is no chat, UGC, or ads |
| News app | No |
| COVID-19 | No |
| Data safety | See below |
| Government / Financial / Health | No |

**Data safety** (matches the privacy page):

- Data collected: email, name, app activity (high scores) — **only if they create an account**
- Not collected when they play signed out
- Encrypted in transit: **Yes**
- Sold: **No**
- Required to use the app: **No** (sign-in optional)
- Account deletion: users open a GitHub issue on [BotGamer4Real/botgamers-arcade](https://github.com/BotGamer4Real/botgamers-arcade) with the account email

---

## 4. Upload the first build (this locks the package)

**Test and release → Testing → Internal testing** first (fast, no 14-day clock, good for you on the Pixel via Play).

1. Create a new release
2. Upload `D:\balance\BotGamersArcade\android\app\build\outputs\bundle\release\app-release.aab`
3. Confirm Play shows package **`com.botgamer4real.arcade`**
4. Release name: `1.0 (1)`
5. Roll out to internal testers
6. Add **your Google account** as an internal tester, open the opt-in link on the Pixel, install from Play

Play App Signing will be enabled by default. Let Google hold the app-signing key; you keep `android/upload-keystore.jks` as the **upload** key. Do not lose that file or `android/keystore.properties`.

Internal testing does **not** count toward the 14 days.

---

## 5. Closed testing (this starts the 14-day requirement)

**Test and release → Testing → Closed testing → Create track** (default alpha is fine).

1. Create a closed release — you can promote the same AAB from internal, or upload it again
2. Add testers by email list and/or a Google Group
3. Copy the **opt-in link** and send it to testers
4. They must: open the link while signed into that Google account → Become a tester → install from Play

You need **12 testers opted in for 14 continuous days**. Invited but not opted in does not count. If the count drops below 12, the streak can break.

You can upload a newer AAB later (`versionCode` 2, 3, …) on this same package without restarting the 14 days.

---

## 6. After the 14 days (not now)

Dashboard → apply for **production access**. Google reviews that (often up to about 7 days). Then you put the polished build on Production.

---

**Do now:** create the app, store listing, privacy URL, policy forms, then upload the current AAB to **internal** testing and confirm the package name.  
**Do next:** closed testing with 12 testers when you are ready to start the clock.
