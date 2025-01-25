const axios = require("axios");
const { WebClient } = require("@slack/web-api");

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchIssuesWithinTimeFrame = async (gitToken, owner, repo, daysAgo, hoursAgo) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=open`;
  const now = new Date();
  const sinceDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  const cutoffDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  let issuesWithinTimeFrame = [];
  let page = 1;
  let olderIssueFound = false;

  try {
    while (true) {
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `token ${gitToken}` },
        params: {
          page,
          per_page: 100,
          since: sinceDate.toISOString(),
        },
      });

      const issues = response.data.filter((issue) => !issue.pull_request);

      const recentIssues = issues.filter((issue) => {
        const createdAt = new Date(issue.created_at);
        if (createdAt < cutoffDate) {
          olderIssueFound = true;
          return false;
        }
        return createdAt <= now;
      });

      issuesWithinTimeFrame.push(
        ...recentIssues.map((issue) => ({
          title: issue.title,
          url: issue.html_url,
          createdAt: issue.created_at,
          labels: issue.labels.map((label) => label.name),
          comments: issue.comments,
        }))
      );

      if (olderIssueFound || !response.headers["link"]?.includes('rel="next"')) break;

      page++;
    }

    return issuesWithinTimeFrame;
  } catch (error) {
    console.error("Error fetching issues:", error.message);
    return [];
  }
};

const sendSlackNotification = async (slackToken, slackChannel, slackIDType, slackID, issues, repo) => {
  if (!issues.length) {
    console.log("No issues found within the specified time frame.");
    return;
  }

  const slack = slackWrapper(slackToken, slackChannel);

  const assigneeText =
    slackIDType === "group"
      ? `*Assignee:* <!subteam^${slackID}> *(Mark as ACK or Done after triaging)*`
      : slackIDType === "user"
      ? `*Assignee:* <@${slackID}> *(Mark as ACK or Done after triaging)*`
      : "";

  for (const issue of issues) {
    const message = `
    :chart_with_upwards_trend: *New Issue in ${repo}*  
    *-* *Title:* ${issue.title}  
    *-* *Labels:* ${issue.labels.map((label) => `\`${label}\``).join(", ")}  
    *-* *Link:* <${issue.url}|View Issue>  
    ${assigneeText}
    `;

    try {
      await slack.sendMessage({ text: message });
      console.log(`Posted issue "${issue.title}" to Slack.`);
    } catch (error) {
      console.error(`Failed to post issue "${issue.title}" to Slack:`, error.message);
    }

    console.log("Waiting for 30 seconds before sending the next message...");
    await delay(30 * 1000);
  }

  console.log(`*** All issues posted on Slack for ${repo} ***`);
};

async function monitorIssues(gitToken, slackToken, slackChannel, owner, repo, slackIDType, slackID) {
  const fetchDaysAgo = 1;
  const filterHoursAgo = 6;

  const issues = await fetchIssuesWithinTimeFrame(gitToken, owner, repo, fetchDaysAgo, filterHoursAgo);
  console.log("Issues to be notified via Slack:", issues.map((issue) => issue.title));

  await sendSlackNotification(slackToken, slackChannel, slackIDType, slackID, issues, repo);
  }
  
  module.exports = { monitorIssues };