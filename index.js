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
let participants = new Map(); // userId -> messageId

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

    // ❌ 1 lien max
    if (participants.has(message.author.id)) {
      try { await message.delete(); } catch {}
      return;
    }

    participants.set(message.author.id, message.id);
  }
});

// 🚫 EMPÊCHE RÉACTION SUR SON PROPRE LIEN
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    const msg = reaction.message;

    for (let [userId, messageId] of participants) {
      if (msg.id === messageId && user.id === userId) {
        await reaction.users.remove(user.id);
      }
    }
  } catch {}
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
🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`,
      files: [{
        attachment: "https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"
      }]
    });

    // ⏱️ TIMER
    while (timeLeft > 0) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          content: `💎 **SESSION ARTICLE** (1 minute)

🕒 Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`
        });
      } catch {}
    }

    // 📊 ANALYSE
    let valid = 0;
    let invalid = 0;
    let starCount = 0;
    let trophyCount = 0;

    for (let [userId, messageId] of participants) {
      try {
        const m = await channel.messages.fetch(messageId);

        let hasCheck = false;
        let hasCross = false;

        for (const reaction of m.reactions.cache.values()) {

          const users = await reaction.users.fetch();

          if (reaction.emoji.name === "✅" && users.size > 0) hasCheck = true;
          if (reaction.emoji.name === "❌" && users.size > 0) hasCross = true;

          if (reaction.emoji.name === "⭐") {
            starCount += users.size;
          }

          if (reaction.emoji.name === "🏆") {
            trophyCount += users.size;
          }
        }

        if (hasCheck && !hasCross) valid++;
        else invalid++;

      } catch {}
    }

    let total = participants.size;

    // 🛑 STOP (CORRIGÉ)
    let stopMsg = await channel.send({
      content: `🛑 **SESSION TERMINÉE**

👥 ${total} participants
⭐ ${starCount}
🏆 ${trophyCount}

✅ ${valid} à jour
❌ ${invalid} pas à jour`,
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
⭐ ${starCount}
🏆 ${trophyCount}

✅ ${valid} à jour
❌ ${invalid} pas à jour

⏳ Prochaine session dans : ${formatTime(next)}`
        });
      } catch {}
    }

    // 🔄 RESET
    participants.clear();
  }

  sessionRunning = false;
}

client.login(TOKEN);
