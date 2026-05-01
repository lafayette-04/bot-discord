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

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);

  setTimeout(() => {
    sessionActive = true;
    runLoop(channel);
  }, 3000);
});

async function runLoop(channel) {
  if (!sessionActive || sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    let timeLeft = 60;

    // ✅ envoie image UNE FOIS
    const image = new AttachmentBuilder("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png");

    let msg = await channel.send({
      content: `💎 **SESSION ARTICLE**

🕒 Temps restant : **01:00**
🎉 ⭐️ autorisés

Pense à réagir aux liens des autres 🧡`,
      files: [image]
    });

    // ⏱️ compteur (SANS toucher à l’image)
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          content: `💎 **SESSION ARTICLE**

🕒 Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐️ autorisés

Pense à réagir aux liens des autres 🧡`
          // ❌ PAS de files ici !!
        });
      } catch {}
    }

    if (!sessionActive) break;

    // 🛑 STOP (image une seule fois aussi)
    const stopImage = new AttachmentBuilder("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png");

    await channel.send({
      content: `🛑 **SESSION TERMINÉE**

⏳ Prochaine dans 25 secondes`,
      files: [stopImage]
    });

    await new Promise(r => setTimeout(r, 25000));
  }

  sessionRunning = false;
}

client.login(TOKEN);
