const { monitorIssues } = require("./monitor-new-issue");
const { monitorPRs } = require("./monitor-new-pr");

const core = require("@actions/core");

async function run() {
  try {
    const task = core.getInput("task");
    const gitToken = core.getInput("git_token");
    const slackToken = core.getInput("slack_bot_token");
    const slackChannel = core.getInput("slack_channel");
    const owner = core.getInput("repo_owner");
    const repo = core.getInput("repo_name");
    const slackIDType = core.getInput("slack_id_type");
    const slackID = core.getInput("slack_id");

    switch (task) {
      case "monitor-issues":
        await monitorIssues(gitToken, slackToken, slackChannel, owner, repo, slackIDType, slackID);
        break;
      case "monitor-prs":
        await monitorPRs(gitToken, slackToken, slackChannel, owner, repo, slackIDType, slackID);
        break;
      default:
        core.setFailed(`Unsupported task: ${task}`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
