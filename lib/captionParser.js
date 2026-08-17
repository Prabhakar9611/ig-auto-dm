// Reads a Reel's own caption and extracts:
//   Trigger: <keyword>   — what someone must comment to trigger the bot
//   Company: <name>      — shown in the DM
//   Apply: <link>        — the job application link
//
// Fully automated — no code edits, no database, just write these 3 lines
// in the caption when you post the Reel.

async function getReelConfigFromCaption(mediaId) {
  const token = (process.env.IG_PAGE_ACCESS_TOKEN || "").trim();
  const url = `https://graph.instagram.com/v21.0/${mediaId}?fields=caption&access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to fetch caption:", data);
    return null;
  }

  const caption = data.caption || "";

  const triggerMatch = caption.match(/trigger:\s*(\S+)/i);
  const companyMatch = caption.match(/company:\s*(.+)/i);
  const applyMatch = caption.match(/apply:\s*(\S+)/i);

  if (!triggerMatch || !applyMatch) return null; // caption not set up yet

  const trigger = triggerMatch[1].trim().toLowerCase();
  const company = companyMatch ? companyMatch[1].trim() : "";
  const applyLink = applyMatch[1].trim();


    const message =
    `🎯 ${company ? company + " opening" : "Job opening"}\n\n` +
    `Apply here 👉 ${applyLink}\n\n` +
    `Join our WhatsApp channel 👉 ${process.env.IG_WHATSAPP_CHANNEL_LINK}\n\n` +
    `Subscribe on YouTube 👉 ${process.env.IG_YOUTUBE_LINK}`;


   return { trigger, company, applyLink };
}

module.exports = { getReelConfigFromCaption };