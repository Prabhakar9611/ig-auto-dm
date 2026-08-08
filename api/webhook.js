const { matchesTrigger } = require("../lib/keywordMatcher");
const {
  sendPrivateReplyWithButtons,
  sendMessageToUser,
} = require("../lib/instagram");
const { alreadyHandled, markHandled } = require("../lib/db");
const { getConfigForMedia } = require("../lib/reelConfig");

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
      // TEMPORARY DEBUG — remove once the flow is confirmed working.
      console.log("RAW WEBHOOK BODY:", JSON.stringify(body));

      // Always 200 fast — Meta retries aggressively if you're slow or error out.
      res.status(200).send("EVENT_RECEIVED");

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
    } catch (err) {
      console.error("Webhook processing error:", err);
    }
    return;
  }

  res.status(405).send("Method not allowed");
};

// Step 1: comment matches trigger keyword -> send the 3-button prompt.
async function handleComment(comment) {
  const commentId = comment.id;
  const commentText = comment.text;
  const mediaId = comment.media?.id;

  if (!commentId || !commentText) return;
  if (await alreadyHandled(commentId)) return;

  const reelConfig = mediaId ? getConfigForMedia(mediaId) : null;
  const keywords = reelConfig?.keywords;
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
  const reelConfig = mediaId && mediaId !== "default" ? getConfigForMedia(mediaId) : null;

  if (action === "FOLLOW_YES") {
    const jobMessage = reelConfig?.message || process.env.IG_DM_MESSAGE;
    await sendMessageToUser(senderId, jobMessage);
  } else if (action === "FOLLOW_NO") {
    const fallbackMessage =
      `No worries! Follow the page, then come back and tap "I'm Following" again.\n` +
      `In the meantime:\n` +
      `WhatsApp channel: ${process.env.IG_WHATSAPP_CHANNEL_LINK}\n` +
      `YouTube: ${process.env.IG_YOUTUBE_LINK}`;
    await sendMessageToUser(senderId, fallbackMessage);
  }
}