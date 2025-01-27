const axios = require("axios");
const delay = require("../utility/delay");
const discordWrapper = (webhookUrl) => {
  const sendMessage = async (content) => {
    try {
      await axios.post(webhookUrl,  content );
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
            message = {
                embeds: [
                  {
                    title: `📈 New Issue in ${repo}`,
                    description: `**Title:** ${issue.title}\n**Labels:** ${issue.labels.map((label) => `\`${label}\``).join(", ")}\n\n[View Issue](${issue.url})`,
                    color: 15548997, // Optional: Embed color as a hex value
                    author: {
                        name: issue.author,
                        icon_url: issue.avatar_url,
                    },
                    footer: {
                      text: "Mark as acknowledged after triaging 👍"
                    }
                  }
                ]
              };
        } else if (type === 'pr') {
            message = {
                embeds: [
                  {
                    title: `🚀 New Pull Request in ${repo}`,
                    description: `**Title:** ${issue.title}\n**Labels:** ${issue.labels.map((label) => `\`${label}\``).join(", ")}\n\n[View PR](${issue.url})`,
                    color: 5763719, // Optional: Embed color as a hex value
                    author: {
                        name: issue.author,
                        icon_url: issue.avatar_url,
                    },
                    footer: {
                      text: "Review and acknowledge👍"
                    }
                  }
                ]
              };
        }
  
      try {
        await discord.sendMessage(message);
        console.log(`Posted issue "${issue.title}" to Discord.`);
      } catch (error) {
        console.error(`Failed to post issue "${issue.title}" to Discord:`, error.message);
      }
  
      // Introduce a delay between messages to avoid rate limiting
      await delay(5 * 1000);
    }
  
    console.log(`*** All issues posted on Discord for ${repo} ***`);
  };

module.exports = sendDiscordNotification;
