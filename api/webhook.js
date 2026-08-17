const { matchesTrigger } = require("../lib/keywordMatcher");
const {
  sendPrivateReplyWithButtons,
  sendMessageToUser,
  sendButtonMessageToUser,
} = require("../lib/instagram");
const { alreadyHandled, markHandled } = require("../lib/db");
const { getReelConfigFromCaption } = require("../lib/captionParser");

module.exports = async (req, res) => {
  // ---- Meta's one-time webhook verification handshake ----
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.IG_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send("Verification failed");
  }

  if (req.method === "POST") {
    try {
      const body = req.body;
      const entries = body.entry || [];

      for (const entry of entries) {
        // ---- CASE 1: someone commented on a Reel/post ----
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field !== "comments") continue;
          await handleComment(change.value);
        }

        // ---- CASE 2: someone tapped a button in the DM we sent them ----
        const messagingEvents = entry.messaging || [];
        for (const event of messagingEvents) {
          if (event.postback) {
            await handlePostback(event);
          }
        }
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (err) {
      console.error("Webhook processing error:", err);
      res.status(200).send("EVENT_RECEIVED"); // still 200 so Meta doesn't retry-storm us
    }
    return;
  }

  res.status(405).send("Method not allowed");
};

// Step 1: comment matches the Reel's own caption-defined trigger word ->
// send the 3-button prompt.
async function handleComment(comment) {
  const commentId = comment.id;
  const commentText = comment.text;
  const mediaId = comment.media?.id;

  if (!commentId || !commentText) return;
  if (await alreadyHandled(commentId)) return;

  const captionConfig = mediaId ? await getReelConfigFromCaption(mediaId) : null;

  // Use the Reel's own caption-defined trigger if set, otherwise fall back
  // to the global IG_TRIGGER_KEYWORDS env var.
  const keywords = captionConfig ? [captionConfig.trigger] : undefined;
  if (!matchesTrigger(commentText, keywords)) return;

  const buttons = [
    {
      type: "postback",
      title: "I'm Following ✅",
      payload: `FOLLOW_YES::${mediaId || "default"}`,
    },
    {
      type: "postback",
      title: "Not Yet ❌",
      payload: `FOLLOW_NO::${mediaId || "default"}`,
    },
    {
      type: "web_url",
      title: "Visit Profile",
      url: process.env.IG_PROFILE_URL,
    },
  ];

  await sendPrivateReplyWithButtons(
    commentId,
    "Thanks for your interest! Are you following the page?",
    buttons
  );

  await markHandled(commentId, comment.from?.id);
}

// Step 2: they tapped "I'm Following" or "Not Yet" -> send the real response.
async function handlePostback(event) {
  const senderId = event.sender?.id;
  const payload = event.postback?.payload;
  if (!senderId || !payload) return;

  const [action, mediaId] = payload.split("::");

if (action === "FOLLOW_YES") {
    let captionConfig = null;
    if (mediaId && mediaId !== "default") {
      captionConfig = await getReelConfigFromCaption(mediaId);
    }

    if (captionConfig) {
      const buttons = [
        { type: "web_url", title: "Apply Now", url: captionConfig.applyLink },
        { type: "web_url", title: "WhatsApp Channel", url: process.env.IG_WHATSAPP_CHANNEL_LINK },
        { type: "web_url", title: "YouTube", url: process.env.IG_YOUTUBE_LINK },
      ];
      await sendButtonMessageToUser(
        senderId,
        captionConfig.company ? `${captionConfig.company} — here's everything 👇` : "Here's everything 👇",
        buttons
      );
    } else {
      await sendMessageToUser(senderId, process.env.IG_DM_MESSAGE);
    }
  } else if (action === "FOLLOW_NO") {
    const fallbackMessage =
      `No worries! Follow the page, then come back and tap "I'm Following" again.\n` +
      `In the meantime:\n` +
      `WhatsApp channel: ${process.env.IG_WHATSAPP_CHANNEL_LINK}\n` +
      `YouTube: ${process.env.IG_YOUTUBE_LINK}`;
    await sendMessageToUser(senderId, fallbackMessage);
  }
}