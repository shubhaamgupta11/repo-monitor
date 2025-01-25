# GitHub Monitor Action

Monitor GitHub issues and PRs, and post updates to Slack.

## Inputs

- `task`: The task to perform (`monitor-issues` or `monitor-prs`).
- `git_token`: GitHub API token.
- `slack_bot_token`: Slack Bot token.
- `slack_channel`: ID of the Slack channel to send notifications.
- `repo_owner`: GitHub repository owner.
- `repo_name`: GitHub repository name.
- `slack_id_type`: Slack ID type (`user` or `group`).
- `slack_id`: Slack ID for notifications.

## Usage

```yaml
- name: Run GitHub Monitor Action
  uses: your-repo/your-action@v1
  with:
    task: "monitor-issues"
    git_token: ${{ secrets.GITHUB_TOKEN }}
    slack_bot_token: ${{ secrets.SLACK_BOT_TOKEN }}
    slack_channel: ${{ secrets.SLACK_CHANNEL }}
    repo_owner: "my-org"
    repo_name: "my-repo"
    slack_id_type: "user"
    slack_id: "U01N6V7HKUJ"
