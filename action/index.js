const monitorIssues = require("./monitor-new-issue");
const monitorPRs = require("./monitor-new-pr");

const core = require("@actions/core");

async function run() {
  try {
    const task = core.getInput("task");
    const gitToken = core.getInput("git_secret");
    const notifier = core.getInput("notifier"); // 'slack' or 'discord'
    const alertTime = core.getInput("fetch_data_interval"); // in hours

    const owner = core.getInput("repo_owner");
    const repo = core.getInput("repo_name");

    // Slack-specific inputs
    const slackToken = core.getInput("slack_bot_token");
    const slackChannel = core.getInput("slack_channel");
    const slackIDType = core.getInput("slack_id_type");
    const slackIDs = core.getInput("slack_ids");

    // Discord-specific inputs
    const discordWebhookUrl = core.getInput("discord_webhook_url");
    const discordIDType = core.getInput("discord_id_type");
    const discordIDs = core.getInput("discord_ids");

        // Check if git_secret is provided
    if (!gitToken) {
      core.setFailed("Error: 'git_secret' is a mandatory input. Please provide a valid GitHub token.");
      return;
    }

    switch (task) {
      case "monitor-issues":
        await monitorIssues({
          gitToken,
          owner,
          repo,
          notifier,
          slackConfig: { slackToken, slackChannel, slackIDType, slackIDs },
          discordConfig: { discordWebhookUrl, discordIDType, discordIDs },
          alertTime,
        });
        break;

      case "monitor-prs":
        await monitorPRs({
          gitToken,
          owner,
          repo,
          notifier,
          slackConfig: { slackToken, slackChannel, slackIDType, slackIDs },
          discordConfig: { discordWebhookUrl, discordIDType, discordIDs },
          alertTime,
        });
        break;

      default:
        core.setFailed(`Unsupported task: ${task}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();