const { WebClient } = require("@slack/web-api");
const delay = require("../utility/delay");
const { generateSlackPayload } = require("../utility/generatePayload");

const slackWrapper = (token, channel) => {
  const client = new WebClient(token);

  const sendMessage = async (args) => {
    try {
      await client.chat.postMessage({
        ...args,
        channel,
        unfurl_links: false,
        unfurl_media: false,
      });
    } catch (e) {
      console.error("Unable to send Slack message:", e.message);
    }
  };

  return {
    sendMessage,
    client,
    channel,
  };
};

const sendSlackNotification = async (
  slackToken,
  slackChannel,
  slackIDType,
  slackID,
  issues,
  repo,
  type
) => {
  if (!issues.length) {
    console.log("No issues found within the specified time frame.");
    return;
  }

  const slack = slackWrapper(slackToken, slackChannel);

  for (const issue of issues) {
    const payload = generateSlackPayload({
      type,
      repo,
      issue,
      slackIDType,
      slackID,
    });

    try {
      await slack.sendMessage(payload);
      console.log(`Posted issue "${issue.title}" to Slack.`);
    } catch (error) {
      console.error(
        `Failed to post issue "${issue.title}" to Slack:`,
        error.message
      );
    }

    // Introduce a delay between messages to avoid rate limiting
    await delay(5 * 1000);
  }

  console.log(`*** All issues posted on Slack for ${repo} ***`);
};

module.exports = sendSlackNotification;
