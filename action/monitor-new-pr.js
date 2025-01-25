const axios = require("axios");
const { WebClient } = require("@slack/web-api");

const slackUsers = {
  shubham: "U024CVBQQ4X",
  kunal: "U01N6V7HKUJ",
  prince: "U03V73LBAJU",
  sarthak: "U03QFV6QFNU",
};

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

const fetchNewPRs = async (gitToken, owner, repo, daysAgo = 1) => {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open`;
  const cutoffDate = new Date(
    new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000
  );

  let newPRs = [];
  let page = 1;

  console.log(`Fetching PRs from ${apiUrl}`);

  try {
    while (true) {
      console.log(`Fetching page ${page}...`);
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `token ${gitToken}` },
        params: { page, per_page: 100 },
      });

      const recentPRs = response.data.filter((pr) => {
        const createdAt = new Date(pr.created_at);
        return pr.user?.login !== "dependabot[bot]" && createdAt >= cutoffDate;
      });

      newPRs.push(
        ...recentPRs.map((pr) => ({
          author: pr.user.login,
          title: pr.title,
          url: pr.html_url,
          createdAt: pr.created_at,
          labels: pr.labels.map((label) => label.name),
        }))
      );

      const linkHeader = response.headers["link"];
      if (!linkHeader || !linkHeader.includes('rel="next"')) break;

      page++;
    }
    return newPRs;
  } catch (error) {
    console.error("Error fetching PRs from GitHub:", error.message);
    return [];
  }
};

const sendSlackNotification = async (prs, slackToken, slackChannel, slackIDType, slackID, repo) => {
  if (prs.length === 0) {
    console.log("No new PRs to notify.");
    return;
  }

  const slack = slackWrapper(slackToken, slackChannel);
  const assigneeText =
    slackIDType === "group"
      ? `*Reviewer:* <!subteam^${slackID}> *(Review and acknowledge)*`
      : slackIDType === "user"
      ? `*Reviewer:* <@${slackID}> *(Review and acknowledge)*`
      : "";

  for (const pr of prs) {
    const message = `
    :sparkles: *New Pull Request in ${repo}*  
    *-* *Title:* ${pr.title}  
    *-* *Author:* ${pr.author}
    *-* *Labels:* ${pr.labels.map((label) => `\`${label}\``).join(", ")}  
    *-* *Link:* <${pr.url}|View PR>  
    ${assigneeText}
    `;

    try {
      await slack.sendMessage({ text: message });
      console.log(`Posted PR "${pr.title}" to Slack.`);
    } catch (error) {
      console.error(`Failed to post PR "${pr.title}" to Slack:`, error.message);
    }

    console.log("Waiting for 30 seconds before sending the next message...");
    await new Promise((resolve) => setTimeout(resolve, 1000 * 30));
  }

  console.log(`*** All PRs posted on Slack for ${repo} ***`);
};

const monitorPRs = async (gitToken, slackToken, slackChannel, owner, repo, slackIDType, slackID, daysAgo = 1) => {
  console.log("Starting PR monitor...");
  const prs = await fetchNewPRs(gitToken, owner, repo, daysAgo);
  console.log(`Found ${prs.length} new PRs:`, prs.map((pr) => pr.title));
  await sendSlackNotification(prs, slackToken, slackChannel, slackIDType, slackID, repo);
};

module.exports = { monitorPRs };