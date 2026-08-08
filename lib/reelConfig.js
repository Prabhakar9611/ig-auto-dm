// Map each job Reel's media ID to its own keyword + full DM message.
// The message can include as many links as you want (apply link, WhatsApp
// group, YouTube video, etc.) — use \n for line breaks between them.
//
// Workflow for every new job Reel you post:
//   1. Post the Reel (e.g. "SDE opening at XYZ Corp, comment JOB for the links")
//   2. Comment on it yourself once, so an event fires and you can see its
//      media ID in your Vercel logs (see "Finding a Reel's media ID" in README)
//   3. Add an entry below with that ID, a trigger word, and the full message
//   4. Redeploy (git push — Vercel auto-deploys)
//
// Any Reel NOT listed here falls back to the global IG_TRIGGER_KEYWORDS /
// IG_DM_MESSAGE from your .env.

const REEL_CONFIG = {
  // Example — Reel announcing an SDE opening at "XYZ Corp"
  // "17895695668004550": {
  //   keywords: ["job"],
  //   message:
  //     "XYZ Corp SDE opening — here's everything:\n" +
  //     "Apply: https://xyzcorp.com/careers/12345\n" +
  //     "WhatsApp group: https://chat.whatsapp.com/abc123\n" +
  //     "Walkthrough video: https://youtube.com/watch?v=xyz",
  // },

  // Example — Reel announcing a Data Analyst opening at "ABC Inc"
  // "17862345671123456": {
  //   keywords: ["job"],
  //   message:
  //     "ABC Inc Data Analyst opening — here's everything:\n" +
  //     "Apply: https://abcinc.com/careers/67890\n" +
  //     "WhatsApp group: https://chat.whatsapp.com/def456",
  // },
};

function getConfigForMedia(mediaId) {
  return REEL_CONFIG[mediaId] || null;
}

module.exports = { getConfigForMedia };
