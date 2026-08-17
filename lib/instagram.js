const GRAPH_URL = "https://graph.instagram.com/v21.0/me/messages";

async function callMessagesApi(payload) {
  const token = (process.env.IG_PAGE_ACCESS_TOKEN || "").trim();

  // Debug info that's safe to log — length and first/last few characters,
  // never the full token. Helps confirm the env var is what we expect
  // without exposing the secret.
  console.log(
    "Token debug — length:",
    token.length,
    "starts:",
    token.slice(0, 6),
    "ends:",
    token.slice(-4)
  );

  // Meta's Instagram API (Instagram Login flow) expects the token as a
  // query parameter on graph.instagram.com — not graph.facebook.com, and
  // not an Authorization header. encodeURIComponent protects against any
  // special characters in the token breaking the URL.
  const url = `${GRAPH_URL}?access_token=${encodeURIComponent(token)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Instagram message send failed:", data);
    throw new Error(data.error?.message || "Failed to send message");
  }

  return data;
}

// Plain-text private reply to a commenter (no buttons).
async function sendPrivateReply(commentId, messageText) {
  return callMessagesApi({
    recipient: { comment_id: commentId },
    message: { text: messageText },
  });
}

// Private reply WITH quick-action buttons — used for the follow-check step.
// Up to 3 buttons: postback buttons (fire a payload back to your webhook)
// and a web_url button (opens a link directly, e.g. your IG profile).
async function sendPrivateReplyWithButtons(commentId, text, buttons) {
  return callMessagesApi({
    recipient: { comment_id: commentId },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons,
        },
      },
    },
  });
}

// Plain-text follow-up DM sent to a specific user (used after they tap a
// button — by then we have their sender ID, not a comment ID).
async function sendMessageToUser(recipientId, messageText) {
  return callMessagesApi({
    recipient: { id: recipientId },
    message: { text: messageText },
  });
}

module.exports = {
  sendPrivateReply,
  sendPrivateReplyWithButtons,
  sendMessageToUser,
};