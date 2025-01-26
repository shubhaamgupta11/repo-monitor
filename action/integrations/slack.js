const { WebClient } = require("@slack/web-api");
const delay = require("../utility/delay");

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
    let message = "";
    let assigneeText = "";

    if (type === "issue") {
      assigneeText =
        slackIDType === "group"
          ? `*Assignee:* <!subteam^${slackID}> *(Mark as ACK or Done after triaging)*`
          : slackIDType === "user"
          ? `*Assignee:* <@${slackID}> *(Mark as ACK or Done after triaging)*`
          : "";

      message = `
            :chart_with_upwards_trend: *New Issue in ${repo}*  
            *-* *Title:* ${issue.title}  
            *-* *Labels:* ${issue.labels
              .map((label) => `\`${label}\``)
              .join(", ")}  
            *-* *Link:* <${issue.url}|View Issue>  
            ${assigneeText}
        `;
    } else if (type === "pr") {
      if (slackIDType === "group") {
        assigneeText = `*Reviewer:* <!subteam^${slackID}> *(Review and acknowledge)*`;
      } else if (slackIDType === "user") {
        assigneeText = `*Reviewer:* <@${slackID}> *(Review and acknowledge)*`;
      }
      message = `
            :sparkles: *New Pull Request in ${repo}*  
            *-* *Title:* ${issue.title}  
            *-* *Author:* ${issue.author}
            *-* *Labels:* ${issue.labels
              .map((label) => `\`${label}\``)
              .join(", ")}  
            *-* *Link:* <${issue.url}|View PR>  
            ${assigneeText}
            `;
    }

    try {
      await slack.sendMessage({ text: message });
      console.log(`Posted issue "${issue.title}" to Slack.`);
    } catch (error) {
      console.error(
        `Failed to post issue "${issue.title}" to Slack:`,
        error.message
      );
    }

    console.log("Waiting for 30 seconds before sending the next message...");
    await delay(5 * 1000);
  }

  console.log(`*** All issues posted on Slack for ${repo} ***`);
};

module.exports = sendSlackNotification;
