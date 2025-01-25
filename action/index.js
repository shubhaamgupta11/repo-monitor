const { monitorIssues } = require("./monitor-new-issue");
const { monitorPRs } = require("./monitor-new-pr");

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
    const slackID = core.getInput("slack_id");

    // Discord-specific inputs
    const discordWebhookUrl = core.getInput("discord_webhook_url");

    switch (task) {
      case "monitor-issues":
        await monitorIssues({
          gitToken,
          owner,
          repo,
          notifier,
          slackConfig: { slackToken, slackChannel, slackIDType, slackID },
          discordConfig: { discordWebhookUrl },
          alertTime,
        });
        break;

      case "monitor-prs":
        await monitorPRs({
          gitToken,
          owner,
          repo,
          notifier,
          slackConfig: { slackToken, slackChannel, slackIDType, slackID },
          discordConfig: { discordWebhookUrl },
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