const axios = require("axios");
const delay = require("../utility/delay");
const { generateDiscordPayload } = require("../utility/generatePayload");

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
const sendDiscordNotification = async (webhookUrl, issues, repo, type, discordIDType, discordID) => {
    if (!issues.length) {
      console.log("No issues found within the specified time frame.");
      return;
    }
  
    const discord = discordWrapper(webhookUrl);


    for (const issue of issues) {
      let payload = generateDiscordPayload({type, repo, issue, discordIDType, discordID});
  
      try {
        await discord.sendMessage(payload);
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
