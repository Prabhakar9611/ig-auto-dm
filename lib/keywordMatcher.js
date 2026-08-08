// Only comments containing one of your trigger words fire a DM.
// This is what keeps you from spamming every single commenter.
// Optionally pass a specific keyword list (e.g. a Reel's own keywords) —
// falls back to the global IG_TRIGGER_KEYWORDS env var if omitted.
function matchesTrigger(commentText, keywordList) {
  if (!commentText) return false;

  const keywords = (
    keywordList || (process.env.IG_TRIGGER_KEYWORDS || "").split(",")
  )
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const text = commentText.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword));
}

module.exports = { matchesTrigger };
