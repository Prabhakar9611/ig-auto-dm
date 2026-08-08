module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Privacy Policy - AuraIGBot</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #222; }
    h1 { font-size: 1.6em; }
    h2 { font-size: 1.2em; margin-top: 1.5em; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p>Last updated: ${new Date().toISOString().split("T")[0]}</p>

  <p>This Privacy Policy explains how AuraIGBot ("we", "our") handles information
  when you interact with our Instagram account through comments and direct
  messages.</p>

  <h2>What we access</h2>
  <p>When you comment on one of our Instagram posts or Reels using a specific
  keyword (e.g. "JOB"), our automated system receives that comment's text and
  your Instagram user ID through Meta's official Instagram API, solely to send
  you an automated direct message in response.</p>

  <h2>What we do with it</h2>
  <p>We use this information only to:</p>
  <ul>
    <li>Identify that a comment matched a trigger keyword</li>
    <li>Send you an automated private reply or direct message with relevant
    information (such as a job link, WhatsApp channel, or YouTube link)</li>
    <li>Avoid sending duplicate replies to the same comment</li>
  </ul>

  <h2>What we don't do</h2>
  <p>We do not sell, share, or use your information for advertising. We do not
  access your followers, following list, or any other private account data
  beyond the comment you post and the resulting conversation.</p>

  <h2>Data storage</h2>
  <p>Comment IDs and the fact that a reply was sent are stored in a private
  database to prevent duplicate messages. This data is not shared with third
  parties.</p>

  <h2>Contact</h2>
  <p>For questions about this policy or to request data deletion, contact us
  via Instagram DM or through the WhatsApp channel linked in our automated
  replies.</p>
</body>
</html>`);
};
