const { MongoClient } = require("mongodb");

// Vercel functions are short-lived, so we cache the connection
// across invocations instead of reconnecting on every request.
let cachedClient = null;

async function getDb() {
  if (cachedClient) {
    return cachedClient.db("ig_auto_dm");
  }
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client.db("ig_auto_dm");
}

// Returns true if we've already handled this comment (prevents duplicate DMs
// if Meta retries the webhook, which it does on slow responses).
async function alreadyHandled(commentId) {
  const db = await getDb();
  const existing = await db.collection("handled_comments").findOne({ commentId });
  return !!existing;
}

async function markHandled(commentId, senderId) {
  const db = await getDb();
  await db.collection("handled_comments").insertOne({
    commentId,
    senderId,
    handledAt: new Date(),
  });
}

module.exports = { getDb, alreadyHandled, markHandled };
