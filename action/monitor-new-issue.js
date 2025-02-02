const axios = require("axios");
const sendSlackNotification = require("./integrations/slack");
const sendDiscordNotification = require("./integrations/discord");

/**
 * Fetch new issues created within a configurable timeframe.
 *
 * @param {string} gitToken - GitHub API token for authentication.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {number} alertTime - Timeframe in hours to fetch issues created since then.
 * @returns {Promise<Array>} - List of new issues created within the specified timeframe.
 */
const fetchNewIssues = async (gitToken, owner, repo, alertTime) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
  console.log("🔍  Fetching new issues... ", apiUrl);
  const sinceDate = new Date(
    new Date().getTime() - alertTime * 60 * 60 * 1000
  ).toISOString();

  let newIssues = [];
  let page = 1;

  try {
    while (true) {
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `token ${gitToken}` },
        params: {
          state: "open", // Only fetch open issues
          sort: "created", // Sort by creation date
          direction: "desc", // Fetch the most recent issues first
          since: sinceDate, // Fetch issues created or updated after this timestamp
          per_page: 100, // Maximum results per page
          page, // Current page of the results
        },
      });

      const issues = response.data.filter((issue) => {
        // Exclude pull requests and ensure the issue is newly created
        const createdAt = new Date(issue.created_at);
        return !issue.pull_request && createdAt >= new Date(sinceDate);
      });

      // Map issues to include required fields
      newIssues.push(
        ...issues.map((issue) => ({
          title: issue.title,
          url: issue.html_url,
          avatar_url: issue.user.avatar_url,
          author: issue.user.login,
          createdAt: issue.created_at,
          labels: issue.labels.map((label) => label.name),
          comments: issue.comments,
        }))
      );

      // Exit loop if no more pages to fetch
      if (!response.headers["link"]?.includes('rel="next"')) break;

      page++; // Move to the next page
    }

    return newIssues;
  } catch (error) {
    console.error("Error fetching issues:", error.response.data);
    return [];
  }
};

async function monitorIssues({
  gitToken,
  owner,
  repo,
  notifier,
  slackConfig,
  discordConfig,
  alertTime,
}) {
  const issues = await fetchNewIssues(gitToken, owner, repo, alertTime);

  if (issues.length === 0) {
    console.log("No new issues found.");
    return;
  }

  if (notifier === "slack") {
    const {
      slackToken,
      slackChannel,
      slackIDType,
      slackIDs,
    } = slackConfig;

    if (!slackToken) {
      console.log("No Slack token provided. Skipping notification.");
      return;
    }

    console.log(
      "🔔 Sending notifications to Slack for issues:",
      issues.map((issue) => issue.title)
    );
    await sendSlackNotification(
      slackToken,
      slackChannel,
      slackIDType,
      slackIDs,
      issues,
      repo,
      "issue"
    );
  } else if (notifier === "discord") {
    const {
      discordWebhookUrl,
      discordIDType,
      discordIDs,
    } = discordConfig;

    if (!discordWebhookUrl) {
      console.log("No Discord webhook URL provided. Skipping notification.");
      return;
    }

    console.log(
      "🔔 Sending notifications to Discord for issues:",
      issues.map((issue) => issue.title)
    );
    await sendDiscordNotification(discordWebhookUrl, issues, repo, "issue", discordIDType, discordIDs);
  } else {
    console.log("No notifier selected. Skipping notification.");
  }
}

module.exports = monitorIssues;