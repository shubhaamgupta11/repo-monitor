function generateSlackPayload({ type, repo, issue, slackIDType, slackID }) {
  let assigneeText = "";
  const shouldDisplayAvatar = true;

  if (type === "issue") {
    assigneeText =
      slackIDType === "group"
        ? `*Assignee:* <!subteam^${slackID}>`
        : slackIDType === "user"
        ? `*Assignee:* <@${slackID}>`
        : "";

    return {
      text: `📈 New Issue in ${repo}: ${issue.title}`, // Fallback text for notifications
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📈 New Issue in ${repo}`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Title:*\n${issue.title}`,
            },
            {
              type: "mrkdwn",
              text: `*Labels:*\n${issue.labels
                .map((label) => `\`${label}\``)
                .join(", ")}`,
            },
            assigneeText
              ? {
                  type: "mrkdwn",
                  text: assigneeText,
                }
              : null,
          ].filter(Boolean),
          accessory: shouldDisplayAvatar
            ? {
                type: "image",
                image_url: issue.avatar_url, // Provide the avatar URL
                alt_text: "Author's Avatar",
              }
            : null,
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "*(Mark as acknowledged👍 after triaging)*",
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View Issue",
              },
              url: issue.url,
              style: "primary",
            },
          ],
        },
      ],
    };
  } else if (type === "pr") {
    assigneeText =
      slackIDType === "group"
        ? `*Reviewer:* <!subteam^${slackID}> `
        : slackIDType === "user"
        ? `*Reviewer:* <@${slackID}> `
        : "";

    return {
      text: `🚀 New Pull Request in ${repo}: ${issue.title}`, // Fallback text for notifications
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `🚀 New Pull Request in ${repo}`,
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Title:*\n${issue.title}`,
            },
            {
              type: "mrkdwn",
              text: `*Author:*\n${issue.author}`,
            },
            {
              type: "mrkdwn",
              text: `*Labels:*\n${issue.labels
                .map((label) => `\`${label}\``)
                .join(", ")}`,
            },
            assigneeText
              ? {
                  type: "mrkdwn",
                  text: assigneeText,
                }
              : null,
          ].filter(Boolean),
          accessory: shouldDisplayAvatar
            ? {
                type: "image",
                image_url: issue.avatar_url, // Provide the avatar URL
                alt_text: "Author's Avatar",
              }
            : null,
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "*(Review and acknowledge👍)*",
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View PR",
              },
              url: issue.url,
              style: "primary",
            },
          ],
        },
      ],
    };
  }
}

const generateDiscordPayload = ({
  type,
  repo,
  issue,
  discordIDType,
  discordID,
}) => {
  let content = "";
  let message = "";

  if (discordIDType === "user") {
    content = `<@${discordID}>`;
  } else if (discordIDType === "role") {
    content = `<@&${discordID}>`;
  }

  if (type === "issue") {
    message = {
      content: content,
      embeds: [
        {
          title: `📈 New Issue in ${repo}`,
          description: `**Title:** ${issue.title}\n**Labels:** ${issue.labels
            .map((label) => `\`${label}\``)
            .join(", ")}\n\n[View Issue](${issue.url})`,
          color: 15548997, // Optional: Embed color as a hex value
          author: {
            name: issue.author,
            icon_url: issue.avatar_url,
          },
          footer: {
            text: "Mark as acknowledged after triaging 👍",
          },
        },
      ],
    };
  } else if (type === "pr") {
    message = {
      content: content,
      embeds: [
        {
          title: `🚀 New Pull Request in ${repo}`,
          description: `**Title:** ${issue.title}\n**Labels:** ${issue.labels
            .map((label) => `\`${label}\``)
            .join(", ")}\n\n[View PR](${issue.url})`,
          color: 5763719, // Optional: Embed color as a hex value
          author: {
            name: issue.author,
            icon_url: issue.avatar_url,
          },
          footer: {
            text: "Review and acknowledge👍",
          },
        },
      ],
    };
  }
  return message;
};

module.exports = { generateSlackPayload, generateDiscordPayload };
