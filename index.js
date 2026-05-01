const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1496696155541864633";
const OWNER_ID = "872925370314260490";

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
let sessionMessages = [];

// ⏱️ format
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// 🎛️ boutons
function getButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("start")
      .setLabel("▶ START")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("stop")
      .setLabel("⏹ STOP")
      .setStyle(ButtonStyle.Danger)
  );
}

// 🎯 interaction boutons
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({
      content: "❌ Pas autorisé",
      ephemeral: true
    });
  }

  if (interaction.customId === "start") {
    sessionActive = true;
    interaction.reply({ content: "🚀 Session lancée", ephemeral: true });
    runLoop(interaction.channel);
  }

  if (interaction.customId === "stop") {
    sessionActive = false;
    interaction.reply({ content: "🛑 Session arrêtée", ephemeral: true });
  }
});

// 📥 récupérer liens
client.on("messageCreate", message => {
  if (!sessionActive) return;
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;

  if (message.content.includes("http")) {
    sessionMessages.push(message);
  }
});

// 🔁 loop
async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    sessionMessages = [];

    let timeLeft = 60;

    // 📸 IMAGE FIX (pas de clignotement)
    await channel.send({
      files: ["https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"]
    });

    let msg = await channel.send({
      content: `💎 SESSION ARTICLE (1 minute)

🕒 Temps restant : 01:00

🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`
    });

    // ⏱️ timer
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit({
        content: `💎 SESSION ARTICLE (1 minute)

🕒 Temps restant : ${formatTime(timeLeft)}

🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`
      });
    }

    if (!sessionActive) break;

    await new Promise(r => setTimeout(r, 2000));

    // 📊 STATS
    let participants = new Set();
    let reactedUsers = new Set();

    for (const m of sessionMessages) {
      participants.add(m.author.id);

      for (const r of m.reactions.cache.values()) {
        const users = await r.users.fetch();
        users.forEach(u => {
          if (!u.bot && u.id !== m.author.id) {
            reactedUsers.add(u.id);
          }
        });
      }
    }

    let total = participants.size;
    let valid = 0;
    let invalid = 0;

    participants.forEach(id => {
      if (reactedUsers.has(id)) valid++;
      else invalid++;
    });

    let starCount = reactedUsers.size;
    let trophyCount = total;

    // 🛑 FIN + bouton JUSTE EN DESSOUS
    await channel.send({
      content: `🛑 SESSION TERMINÉE

👥 ${total} participants
⭐ ${starCount}
🏆 ${trophyCount}

✅ ${valid} à jour
❌ ${invalid} pas à jour`,
      components: [getButtons()]
    });

    // ⏳ prochaine session
    let next = 30;

    let nextMsg = await channel.send({
      content: `⏳ Prochaine session dans : ${formatTime(next)}`
    });

    while (next > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      next--;

      await nextMsg.edit({
        content: `⏳ Prochaine session dans : ${formatTime(next)}`
      });
    }
  }

  sessionRunning = false;
}

client.login(TOKEN);
