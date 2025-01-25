# Monitor Issues and PRs GitHub Action

## Overview
A GitHub Action to monitor new issues and pull requests in a specified repository and send notifications to Slack or Discord. This action allows you to track activity in your repositories and get alerted when new issues or PRs are created.

## Features

- Monitor issues and PRs in a GitHub repository.
- Support for multiple notification methods.
- Easy integration with GitHub workflows.

## Inputs

| Input | Description | Required | Default |
| ----- | ----------- | -------- | ------- |
| task | The task to run (monitor-issues or monitor-prs). | Yes | None |
| git_secret | GitHub token for authentication. | Yes | None |
| repo_owner | The owner of the GitHub repository (`facebook`). | Yes | None |
| repo_name | The name of the GitHub repository (`react-native`). | Yes | None |
| fetch_data_interval | The time interval to fetch data for (e.g., 1 hour, 24 hours). This should align with the cron schedule. | Yes | None |
| notifier | Notification method (**slack** or **discord**). | Yes | None |
| slack_bot_token | Slack bot token to send notifications (required if notifier=`slack`). | No | None |
| slack_channel | The Slack channel id to send notifications to (required if notifier=`slack`). | No | None |
| slack_id_type | Type of Slack ID (user or group, required if notifier=`slack`). This is needed to ping someone directly. | No | None |
| slack_id | user id or group id as per `slack_id_type` (required if notifier=`slack`). | No | None |
| discord_webhook_url | Discord webhook URL to send notifications (required if notifier=`discord`). | No | None |

## Example Usage

```yml
name: Monitor GitHub Repo

on:
  schedule:
    - cron: "0 * * * *" # Runs every hour
  workflow_dispatch:

jobs:
  run-notifier:
    runs-on: ubuntu-latest
    steps:
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Run action
        uses: ./ # Path to your action
        with:
          task: "monitor-issues"
          git_secret: "${{ secrets.GITHUB_TOKEN }}"
          notifier: "slack"  # Or "discord"
          fetch_data_interval: 24  # Hours (must align with your cron schedule)
          slack_bot_token: "${{ secrets.SLACK_BOT_TOKEN }}"
          slack_channel: "#your-channel"
          repo_owner: "facebook"
          repo_name: "react-native"
```

## How It Works
- The action listens for new issues or PRs in the specified GitHub repository.
- Depending on the `task` input, it will either monitor new issues (`monitor-issues`) or pull requests (`monitor-prs`).
- Once a new issue or PR is detected, it sends a notification via Slack or Discord based on the `notifier` input.
- The action checks for issues or PRs within the time period defined by `fetch_data_interval`, which should align with the cron schedule. For example, if the cron schedule is set to run every hour `(0 * * * *)`, set `fetch_data_interval` to 1 hour.

## Setting up Slack
If you choose Slack as the notification method, you will need to create a Slack app and retrieve the **Slack Bot Token** and **Channel**:

- Create a Slack app.
- Generate a **Slack Bot Token**.
- Get the **Channel I**D.
- Get the **Slack User ID** or **Group ID**.
- Add these tokens/IDs to the GitHub secrets (`SLACK_BOT_TOKEN`, `SLACK_CHANNEL`, `SLACK_ID_TYPE`, and `SLACK_ID`).

`slack_id_type` Explanation
- `user`: Use this if you want to send a notification to an individual user.
- `group`: Use this if you want to send a notification to a group of users (e.g., a Slack channel or a group).

## Setting up Discord
If you choose Discord as the notification method, you will need a Discord Webhook URL:

- Create a **Discord Webhook**.
- Copy the Webhook URL and add it to the GitHub secrets (`DISCORD_WEBHOOK_URL`).

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
