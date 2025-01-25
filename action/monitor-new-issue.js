const axios = require("axios");
const sendSlackNotification = require("./integrations/slack");
const sendDiscordNotification = require("./integrations/discord");

/**
 * Fetch new issues created within a configurable timeframe.
 *
 * @param {string} gitToken - GitHub API token for authentication.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {number} hoursAgo - Timeframe in hours to fetch issues created since then.
 * @returns {Promise<Array>} - List of new issues created within the specified timeframe.
 */
const fetchNewIssues = async (gitToken, owner, repo, hoursAgo) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
  const sinceDate = new Date(
    new Date().getTime() - hoursAgo * 60 * 60 * 1000
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
    console.error("Error fetching issues:", error.message);
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
}) {
  const hoursAgo = 24;

  const issues = await fetchNewIssues(gitToken, owner, repo, hoursAgo);

  if (notifier === "slack") {
    const {
      slackToken,
      slackChannel,
      slackIDType,
      slackID,
    } = slackConfig;
    console.log(
      "Sending notifications to Slack for issues:",
      issues.map((issue) => issue.title)
    );
    await sendSlackNotification(
      slackToken,
      slackChannel,
      slackIDType,
      slackID,
      issues,
      repo
    );
  } else if (notifier === "discord") {
    const {
      discordWebhookUrl,
    } = discordConfig;
    console.log(
      "Sending notifications to Discord for issues:",
      issues.map((issue) => issue.title)
    );
    await sendDiscordNotification(discordWebhookUrl, issues, repo);
  } else {
    throw new Error("Unsupported notifier. Use 'slack' or 'discord'.");
  }
}

monitorIssues();
