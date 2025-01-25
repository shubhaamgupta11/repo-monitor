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
    const sinceDate = new Date(new Date().getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
  
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
  const hoursAgo = 6;

  const issues = await fetchNewIssues(gitToken, owner, repo, hoursAgo);
  console.log("Issues to be notified via Slack:", issues.map((issue) => issue.title));

  await sendSlackNotification(slackToken, slackChannel, slackIDType, slackID, issues, repo);
  }
  
  module.exports = { monitorIssues };