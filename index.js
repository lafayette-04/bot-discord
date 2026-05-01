const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1496696155541864633";
const OWNER_ID = "amine_lafayette";

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
let participants = new Map();

// ⏱️ format
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ⏰ CHECK HORAIRE
function isAllowedTime() {
  const now = new Date();
  const hour = now.getHours();

  // autorisé entre 09h → 01h
  return (hour >= 9 || hour < 1);
}

// 🔥 READY
client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) return console.log("❌ Channel introuvable");

  // 🔘 Boutons admin
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('start')
      .setLabel('▶️ START')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('stop')
      .setLabel('⏹ STOP')
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: "🎛️ **Contrôle des sessions (admin)**",
    components: [row]
  });

  // 🔁 Vérifie toutes les minutes
  setInterval(() => {
    const allowed = isAllowedTime();

    if (allowed && !sessionActive) {
      sessionActive = true;
      runLoop(channel);
      console.log("🟢 Auto START (09h → 01h)");
    }

    if (!allowed && sessionActive) {
      sessionActive = false;
      console.log("🔴 Auto STOP (hors horaires)");
    }

  }, 60000);
});

// 🔘 BOUTONS
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Pas autorisé", ephemeral: true });
  }

  if (interaction.customId === "stop") {
    sessionActive = false;
    return interaction.reply({ content: "🛑 Sessions arrêtées", ephemeral: true });
  }

  if (interaction.customId === "start") {
    if (!sessionActive) {
      sessionActive = true;
      runLoop(interaction.channel);
    }
    return interaction.reply({ content: "🚀 Sessions relancées", ephemeral: true });
  }
});

// 📦 LIENS
client.on('messageCreate', async (message) => {
  if (message.author.bot || !sessionActive) return;

  if (message.content.includes("http")) {
    if (participants.has(message.author.id)) {
      try { await message.delete(); } catch {}
      return;
    }

    participants.set(message.author.id, message.id);
  }
});

// 🚫 REACT SUR SON PROPRE MESSAGE
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    for (let [userId, messageId] of participants) {
      if (reaction.message.id === messageId && user.id === userId) {
        await reaction.users.remove(user.id);
      }
    }
  } catch {}
});

// 🔁 LOOP
async function runLoop(channel) {
  if (!sessionActive || sessionRunning) return;
  sessionRunning = true;

  while (sessionActive && isAllowedTime()) {

    let timeLeft = 60;

    let msg = await channel.send({
      content: `💎 **SESSION ARTICLE (1 minute)**

🕒 Temps restant : **01:00**
🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`,
      files: [{
        attachment: "https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"
      }]
    });

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          content: `💎 **SESSION ARTICLE (1 minute)**

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

          if (reaction.emoji.name === "⭐") starCount += users.size;
          if (reaction.emoji.name === "🏆") trophyCount += users.size;
        }

        if (hasCheck && !hasCross) valid++;
        else invalid++;

      } catch {}
    }

    let total = participants.size;

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

    let next = 30;

    while (next > 0 && sessionActive) {
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

    participants.clear();
  }

  sessionRunning = false;
}

client.login(TOKEN);
