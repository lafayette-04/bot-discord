const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1496696155541864633";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

let sessionActive = false;
let sessionRunning = false;

// 📊 DATA
let participants = new Map(); // userId -> { messageId, valid }
let messageIds = [];

// ⏱️ format
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 🔥 READY
client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) return console.log("❌ Channel introuvable");

  setTimeout(() => {
    sessionActive = true;
    runLoop(channel);
  }, 3000);
});

// 📩 DETECTE LIENS + ANTI SPAM
client.on('messageCreate', async (message) => {
  if (!sessionActive) return;
  if (message.author.bot) return;

  if (message.content.includes("http")) {

    // ❌ Anti spam (1 lien max)
    if (participants.has(message.author.id)) {
      try {
        await message.delete();
      } catch {}
      return;
    }

    messageIds.push(message.id);

    participants.set(message.author.id, {
      messageId: message.id,
      valid: false
    });
  }
});

// 🔁 LOOP
async function runLoop(channel) {
  if (!sessionActive || sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    let timeLeft = 60;

    // 🔥 START
    let msg = await channel.send({
      content: `💎 **SESSION ARTICLE** (1 minute)

🕒 Temps restant : **01:00**
🎉 ⭐ et ♾️ autorisés

Pense à réagir aux liens des autres 🧡`,
      files: [{
        attachment: "https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"
      }]
    });

    // ⏱️ TIMER SESSION
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          content: `💎 **SESSION ARTICLE** (1 minute)

🕒 Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐ et ♾️ autorisés

Pense à réagir aux liens des autres 🧡`
        });
      } catch {}
    }

    // 📊 ANALYSE
    let valid = 0;
    let invalid = 0;
    let infinite = 0;

    for (let [userId, data] of participants) {
      try {
        const m = await channel.messages.fetch(data.messageId);

        let hasCheck = false;
        let hasCross = false;

        m.reactions.cache.forEach(r => {
          if (r.emoji.name === "✅") hasCheck = true;
          if (r.emoji.name === "❌") hasCross = true;
          if (r.emoji.name === "♾️") infinite++;
        });

        if (hasCheck && !hasCross) {
          valid++;
        } else {
          invalid++;
        }

      } catch {}
    }

    let total = participants.size;

    // 🏆 TOP (top 3)
    let top = [...participants.keys()].slice(0, 3)
      .map((id, i) => `#${i+1} <@${id}>`)
      .join("\n") || "Aucun";

    // 🛑 STOP
    let stopMsg = await channel.send({
      content: `🛑 **SESSION TERMINÉE**

👥 ${total} participants
⭐ ${valid} validés
♾️ ${infinite}

✅ ${valid} à jour
❌ ${invalid} pas à jour

🏆 **Top participants**
${top}`,
      files: [{
        attachment: "https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"
      }]
    });

    // ⏱️ NEXT TIMER
    let next = 30;

    while (next > 0) {
      await new Promise(r => setTimeout(r, 1000));
      next--;

      try {
        await stopMsg.edit({
          content: `🛑 **SESSION TERMINÉE**

👥 ${total} participants
⭐ ${valid} validés
♾️ ${infinite}

✅ ${valid} à jour
❌ ${invalid} pas à jour

🏆 **Top participants**
${top}

⏳ Prochaine session dans : ${formatTime(next)}`
        });
      } catch {}
    }

    // 🔄 RESET
    participants.clear();
    messageIds = [];
  }

  sessionRunning = false;
}

client.login(TOKEN);
