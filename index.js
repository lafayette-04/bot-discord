const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1496696155541864633";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let sessionActive = false;
let sessionRunning = false;

// ⏱️ format temps
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 🔥 READY + AUTO START
client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);

  if (!channel) {
    console.log("❌ Channel introuvable");
    return;
  }

  setTimeout(() => {
    sessionActive = true;
    console.log("🚀 Session auto lancée");
    runLoop(channel);
  }, 3000);
});

// 🔁 LOOP PRINCIPALE
async function runLoop(channel) {
  if (!sessionActive || sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    let timeLeft = 60;

    // 📸 IMAGE SESSION (envoyée UNE FOIS)
    const image = new AttachmentBuilder("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png");

    let msg = await channel.send({
      content: `💎 **SESSION ARTICLE**

🕒 Temps restant : **01:00**
🎉,⭐️ et ♾️ autorisés

Pense à réagir aux liens des autres 🧡`,
      files: [image]
    });

    // ⏱️ COMPTEUR SESSION
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          content: `💎 **SESSION ARTICLE**

🕒 Temps restant : **${formatTime(timeLeft)}**
🎉,⭐️ et ♾️ autorisés

Pense à réagir aux liens des autres 🧡`
        });
      } catch {}
    }

    if (!sessionActive) break;

    // 🛑 IMAGE STOP
    const stopImage = new AttachmentBuilder("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png");

    let nextTime = 25;

    let stopMsg = await channel.send({
      content: `🛑 **SESSION TERMINÉE**

⏳ Prochaine session dans : **00:25**`,
      files: [stopImage]
    });

    // ⏱️ COMPTEUR PROCHAINE SESSION
    while (nextTime > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      nextTime--;

      try {
        await stopMsg.edit({
          content: `🛑 **SESSION TERMINÉE**

⏳ Prochaine session dans : **${formatTime(nextTime)}**`
        });
      } catch {}
    }
  }

  sessionRunning = false;
}

// 🚀 LOGIN
client.login(TOKEN);
