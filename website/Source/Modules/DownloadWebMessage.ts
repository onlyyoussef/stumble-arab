import https from "https";

const WEBHOOK_PAYLOAD = {
  username: "StumblePrix",
  avatar_url: "https://i.postimg.cc/jjFtMJY1/unknown.png",
  embeds: [
    {
      color: 16744192,
      author: {
        name: "StumblePrix Releases",
        icon_url: "https://i.postimg.cc/jjFtMJY1/unknown.png",
      },
      description:
        "⚠️ Any other server sharing our content is not legitimate. The only source you can trust is us. ✅",
      fields: [
        {
          name: "Informations regarding what you're downloading:",
          value:
            "**• MelonLoader version:** `0.7.0` <:ML:1505704198941966377>\n↳ MelonLoader is a safe, open-source modding framework. It is widely used by developers to mod Unity games and is very easy to use.\n\n**• Stumble Guys version:** `0.56` <:StumbleGuy:1505704316919353451>\n↳ This is the build of Stumble Guys we are currently using to host Classic Tournaments. Its original release date is **13 September 2023**.\n\n**• StumblePrix version:** `0.1.6` 🏁\n↳ Current release version. New features are added to the StumblePrix client with each update.",
          inline: false,
        },
        {
          name: "What's StumblePrix? <:small:1505703338652467250>",
          value:
            "↳ StumblePrix is a modification of the popular game **Stumble Guys**. It aims to provide the best experience with a proper anti-cheat, many features, and **Classic Tournaments**. <:Trophy:1505703772809334814>",
          inline: false,
        },
        {
          name: "<:small:1505703338652467250> - Game Folder Download:",
          value:
            "↳ This is required to access our version. If you don't install it, you cannot play StumblePrix. If a new release is available and you already have this folder, you don't need to re-download it.\n\n[Click here](https://mega.nz/file/uypxjBzZ#PM1seRZnT1H5GC1lR2Pte2gF4vouQwMYArv4ayup35c)",
          inline: false,
        },
        {
          name: "<:small:1505703338652467250> - DLL Download:",
          value:
            "↳ This is required to access our version. For every new version of StumblePrix, you must re-download this DLL to get the latest game content. If you don't, you won't be able to play!\n\n[Click here](https://www.mediafire.com/file/xb65wcaoq56v3a8/StumblePrix.dll/file)",
          inline: false,
        },
      ],
      thumbnail: {
        url: "https://i.postimg.cc/jjFtMJY1/unknown.png",
      },
      footer: {
        text: "StumblePrix",
      },
    },
  ],
};

/**
 * Sends the StumblePrix release message to a Discord webhook.
 * The webhook URL is read from the DOWNLOAD_WEBHOOK_URL environment variable.
 */
export async function SendDownloadWebMessage(): Promise<void> {
  const webhookUrl = process.env.DOWNLOAD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("[DownloadWebMessage] DOWNLOAD_WEBHOOK_URL is not set — skipping webhook.");
    return;
  }

  const body = JSON.stringify(WEBHOOK_PAYLOAD);

  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);

    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      // Discord returns 204 No Content on success
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        console.log("[DownloadWebMessage] Webhook sent successfully.");
        resolve();
      } else {
        console.error(`[DownloadWebMessage] Webhook failed with status ${res.statusCode}.`);
        resolve(); // resolve anyway so the server still starts
      }
      res.resume(); // drain the response
    });

    req.on("error", (err) => {
      console.error("[DownloadWebMessage] Error sending webhook:", err.message);
      resolve(); // resolve anyway so the server still starts
    });

    req.write(body);
    req.end();
  });
}
