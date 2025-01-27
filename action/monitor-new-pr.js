const axios = require("axios");
const sendSlackNotification = require("./integrations/slack");
const sendDiscordNotification = require("./integrations/discord");

/**
 * Fetch new pull requests created within the last `alertTime` days.
 *
 * @param {string} gitToken - GitHub API token for authentication.
 * @param {string} owner - Repository owner.
 * @param {string} repo - Repository name.
 * @param {number} alertTime - Timeframe in days to fetch PRs created since then. Default: 1 day.
 * @returns {Promise<Array>} - List of new pull requests created within the specified timeframe.
 */
const fetchNewPRs = async (gitToken, owner, repo, alertTime) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  console.log("🔍  Fetching new PRs... ", apiUrl);
  const cutoffDate = new Date(
    Date.now() - alertTime * 60 * 60 * 1000
  ).toISOString();

  let newPRs = [];
  let page = 1;

  try {
    while (true) {
      console.log(`Fetching page ${page}...`);
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `token ${gitToken}` },
        params: {
          state: "open", // Fetch only open PRs
          per_page: 100, // Maximum results per page
          page, // Current page of the results
        },
      });

      const recentPRs = response.data.filter((pr) => {
        const createdAt = new Date(pr.created_at);
        // Exclude PRs created by dependabot and older than the cutoff date
        return (
          pr.user?.login !== "dependabot[bot]" &&
          createdAt >= new Date(cutoffDate)
        );
      });

      newPRs.push(
        ...recentPRs.map((pr) => ({
          author: pr.user.login,
          avatar_url: pr.user.avatar_url,
          title: pr.title,
          url: pr.html_url,
          createdAt: pr.created_at,
          labels: pr.labels.map((label) => label.name),
        }))
      );

      const hasNextPage = response.headers["link"]?.includes('rel="next"');
      if (!hasNextPage) break;

      page++;
    }

    console.log(`Fetched ${newPRs.length} new PR(s)`);
    return newPRs;
  } catch (error) {
    console.error("Error fetching PRs:", error.message);
    return [];
  }
};

async function monitorPRs({
  gitToken,
  owner,
  repo,
  notifier,
  slackConfig,
  discordConfig,
  alertTime,
}) {
  console.log("Starting PR monitor...");

  const prs = await fetchNewPRs(gitToken, owner, repo, alertTime);

  if (prs.length === 0) {
    console.log("No new PRs found.");
    return;
  }

  if (notifier === "slack") {
    const {
      slackToken,
      slackChannel,
      slackIDType,
      slackID,
    } = slackConfig;
    console.log(
      "🔔 Sending notifications to Slack for PRs:",
      prs.map((pr) => pr.title)
    );
    await sendSlackNotification(
      slackToken,
      slackChannel,
      slackIDType,
      slackID,
      prs,
      repo,
      "pr"
    );
  } else if (notifier === "discord") {
    const {
      discordWebhookUrl,
      discordIDType,
      discordID,
    } = discordConfig;
    console.log(
      "🔔 Sending notifications to Discord for PRs:",
      prs.map((pr) => pr.title)
    );
    await sendDiscordNotification(discordWebhookUrl, prs, repo, "pr", discordIDType, discordID);
  } else {
    throw new Error("Unsupported notifier. Use 'slack' or 'discord'.");
  }
}

module.exports = monitorPRs;