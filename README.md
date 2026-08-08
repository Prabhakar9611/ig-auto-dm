# Instagram Comment-to-DM Automation (100% free stack)

When someone comments a trigger word (e.g. "JOB") on your Instagram post,
this automatically DMs them a follow-check prompt with buttons, then sends
the right response based on their tap — using Meta's official API, so no
ToS risk and no account ban risk.

**Stack:** Vercel (free) + MongoDB Atlas (free) + Meta Graph API (free, always)

---

## Part 1 — Instagram / Meta setup (do this first, takes the longest)

1. **Convert your Instagram to a Business or Creator account**
   Instagram app → Settings → Account type and tools → switch to Professional.

2. **Create a Facebook Page and link it**
   Meta requires every Business/Creator IG account to be linked to a Facebook
   Page (also free). Do this in Instagram Settings → Linked accounts.

3. **Create a Meta App**
   Go to https://developers.facebook.com/apps → Create App → choose
   "Business" type → give it any name.

4. **Add products to your app**
   In the App Dashboard, add:
   - **Instagram Graph API**
   - **Webhooks**

5. **Get your Page Access Token**
   App Dashboard → your linked Page → generate a long-lived Page Access
   Token. Copy it — you'll need it for `IG_PAGE_ACCESS_TOKEN`.

6. **Leave the Webhook subscription step open for now**
   You'll come back here after your app is deployed to Vercel, because Meta
   needs a live URL to verify. When you do, subscribe to BOTH:
   - `comments` field — fires when someone comments
   - `messaging` field — fires when someone taps a button in the DM

---

## Part 2 — Database (MongoDB Atlas, free tier)

1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create a free (M0) cluster.
3. Database Access → add a user with a password.
4. Network Access → allow access from anywhere (`0.0.0.0/0`) — fine for this scale.
5. Get your connection string (Connect → Drivers → copy the URI). This is
   your `MONGODB_URI`.

---

## Part 3 — Deploy to Vercel (free)

1. Push this project folder to a new GitHub repo.
2. Go to https://vercel.com → New Project → import that repo.
3. Before deploying, add these Environment Variables (from `.env.example`):
   - `IG_VERIFY_TOKEN` — make up any random string
   - `IG_PAGE_ACCESS_TOKEN` — from Part 1, step 5
   - `IG_TRIGGER_KEYWORDS` — e.g. `job`
   - `IG_PROFILE_URL` — your Instagram profile link
   - `IG_WHATSAPP_CHANNEL_LINK` — your WhatsApp channel invite link
   - `IG_DM_MESSAGE` — fallback message if a Reel has no `reelConfig.js` entry
   - `MONGODB_URI` — from Part 2, step 5
4. Deploy. Your webhook URL is:
   `https://YOUR-PROJECT-NAME.vercel.app/api/webhook`

---

## Part 4 — Connect the webhook (back to Meta dashboard)

1. App Dashboard → Webhooks → Instagram → Subscribe.
2. **Callback URL:** `https://YOUR-PROJECT-NAME.vercel.app/api/webhook`
3. **Verify Token:** the same string you set as `IG_VERIFY_TOKEN`.
4. Click Verify and Save — Meta will hit your live URL and confirm.
5. Subscribe to **both** the `comments` field and the `messaging` field —
   `messaging` is required for button taps to reach your webhook.

---

## Part 5 — Test it

1. Comment "job" (or whatever keyword you set) on one of your own posts,
   using a *different* Instagram account (not the one running the bot).
2. Within a few seconds, that account should receive a DM with 3 buttons.
3. Tap "I'm Following ✅" — you should get the job message back.
4. Tap "Not Yet ❌" on a separate test comment — you should get the WhatsApp
   channel link instead.
5. Check Vercel's dashboard → your project → Logs, to see both webhook
   events (`comments` then `messaging`) fire and debug anything that
   doesn't work.

---

## Staying free forever

- **Vercel Hobby:** free, resets monthly, caps at 100GB traffic / 1M function
  calls a month. A personal account doing this will never get close.
- **MongoDB Atlas free tier:** 512MB storage — enough for tens of thousands
  of logged comments.
- **Meta Graph API:** no cost tier exists at all, for anyone, ever.
- The only way this starts costing money: you turn it into a paid product for
  other people, or your usage genuinely explodes into thousands of DMs/day.

---

## How it works, in short

- Someone comments a trigger keyword → Meta POSTs the event to your webhook.
- Your bot sends a private reply with **3 buttons**: "I'm Following ✅",
  "Not Yet ❌", and "Visit Profile" (opens your IG profile directly).
- Tapping a button fires a second event (`messaging`/postback) back to the
  same webhook:
  - **"I'm Following"** → bot sends the job message (link(s) from
    `reelConfig.js`, or the fallback `IG_DM_MESSAGE`)
  - **"Not Yet"** → bot sends your WhatsApp channel link instead, with a
    prompt to follow and tap the button again
- MongoDB logs every handled comment so the button prompt only fires once
  per comment.

**Be upfront with yourself about what this actually verifies:** Instagram's
API has no way to check whether a specific person really follows you — this
is a confirmed platform limitation, not a gap in this code (even ManyChat,
CreatorFlow, and every other Meta-approved automation tool run into the same
wall). "I'm Following" is a **self-reported tap**, not a verified check.
Someone can tap it without actually following, or tap it, get the link, then
unfollow. The button flow is still worth having — it nudges people toward
following and gives non-followers a WhatsApp path instead of nothing — but
it's an honor system with better UX, not real verification.

---

## Job Reels — unique links per Reel (manual, via reelConfig.js)

Each Reel's job message (sent after someone taps "I'm Following ✅") is set
manually in `lib/reelConfig.js`, keyed by media ID — same as before. The
message can include multiple links (apply link, WhatsApp group, YouTube
walkthrough, etc.) using `\n` for line breaks.

**Workflow for each new job Reel:**

1. Post the Reel with a caption like:
   *"SDE opening at XYZ Corp — comment JOB and I'll DM you 👇"*
2. Comment "JOB" on it yourself once so a webhook event fires.
3. Check your Vercel logs for that comment's `media.id`. Copy it.
4. Open `lib/reelConfig.js` and add:
   ```js
   "17895695668004550": {
     keywords: ["job"],
     message:
       "XYZ Corp SDE opening — here's everything:\n" +
       "Apply: https://xyzcorp.com/careers/12345\n" +
       "WhatsApp group: https://chat.whatsapp.com/abc123",
   },
   ```
5. `git push` — Vercel auto-redeploys in ~10 seconds.

From then on, that Reel's "I'm Following ✅" button sends that job's message.
Reels not listed here fall back to `IG_DM_MESSAGE`.

## Important limits to know

- Button templates in DMs work via the standard Messenger Platform payload
  format. If Meta's Private Reply endpoint ever rejects a button template
  (API behavior for private replies specifically can be stricter than
  regular DMs), the fallback is to drop buttons and go back to a plain-text
  "reply YES or NOT YET" flow — same logic, just typed instead of tapped.
  Test this early after deploying.

- Meta's Private Reply API only works on **comments on your own posts**, not
  arbitrary DMs to anyone.
- Meta may rate-limit or flag accounts that reply too fast/identically to
  large volumes of comments — keep your message natural and not spammy.
- Meta App Review: while your app is in "Development mode" this only works
  for accounts with a role on your app (e.g. your own test account). To let
  it work for the public, you'll need to submit for App Review
  (`instagram_manage_messages` permission) — free, but takes Meta a few days
  to approve.
