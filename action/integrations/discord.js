const axios = require("axios");
const delay = require("../utility/delay");
const discordWrapper = (webhookUrl) => {
  const sendMessage = async (content) => {
    try {
      await axios.post(webhookUrl, { content });
    } catch (e) {
      console.error("Unable to send Discord message:", e.message);
    }
  };

  return {
    sendMessage,
  };
};

// Send Discord Notifications
const sendDiscordNotification = async (webhookUrl, issues, repo, type) => {
    if (!issues.length) {
      console.log("No issues found within the specified time frame.");
      return;
    }
  
    const discord = discordWrapper(webhookUrl);
  
    for (const issue of issues) {
        let message = '';
        if (type === 'issue') {
            message = `
            :chart_with_upwards_trend: **New Issue in ${repo}**  
            *-* **Title:** ${issue.title}  
            *-* **Labels:** ${issue.labels
              .map((label) => `\`${label}\``)
              .join(", ")}  
            *-* **Link:** <${issue.url}>

        Mark as acknowledged👍 after triaging
        `;
        } else if (type === 'pr') {
            message = `
            :sparkles: **New Pull Request in ${repo}**  
            *-* **Title:** ${issue.title}  
            *-* **Author:** ${issue.author}
            *-* **Labels:** ${issue.labels
              .map((label) => `\`${label}\``)
              .join(", ")}  
            *-* **Link:** <${issue.url}>
        Review and acknowledge👍
        `;
        }
  
      try {
        await discord.sendMessage(message);
        console.log(`Posted issue "${issue.title}" to Discord.`);
      } catch (error) {
        console.error(`Failed to post issue "${issue.title}" to Discord:`, error.message);
      }
  
      console.log("Waiting for 30 seconds before sending the next message...");
      await delay(5 * 1000);
    }
  
    console.log(`*** All issues posted on Discord for ${repo} ***`);
  };

module.exports = sendDiscordNotification;
