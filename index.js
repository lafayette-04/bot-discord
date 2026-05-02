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

let trophyUser = null;
let trophyExpire = 0;

let pauseBetween = false; // 🔒 BLOQUAGE ENTRE LES SESSIONS

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function getButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("start").setLabel("▶ START").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("stop").setLabel("⏹ STOP").setStyle(ButtonStyle.Danger)
  );
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Pas autorisé", ephemeral: true });
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

client.on("messageCreate", message => {
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;

  // 🔒 BLOQUAGE ENTRE SESSIONS
  if (pauseBetween) {
    if (message.content.includes("http")) {
      return message.delete();
    }
  }

  if (!sessionActive) return;
  if (!message.content.includes("http")) return;

  const isTrophyLink = message.content.startsWith("🏆");

  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  if (message.author.id === trophyUser && Date.now() < trophyExpire) {
    if (userLinks === 1 && !isTrophyLink) return message.delete();
    if (userLinks >= 2) return message.delete();
  } else {
    if (isTrophyLink) return message.delete();
    if (userLinks >= 1) return message.delete();
  }

  sessionMessages.push(message);
});

async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    pauseBetween = false;
    sessionMessages = [];
    let timeLeft = 60;

    await channel.send({
      files: ["https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"]
    });

    let msg = await channel.send({
      content: `💎 **SESSION ARTICLE (1 minute)**
⏱️ Temps restant : **01:00**
🎉 ⭐ et 🏆 autorisés
Pense à réagir aux liens des autres 🧡`
    });

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit({
        content: `💎 **SESSION ARTICLE (1 minute)**
⏱️ Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐ et 🏆 autorisés
Pense à réagir aux liens des autres 🧡`
      });
    }

    if (!sessionActive) break;

    await new Promise(r => setTimeout(r, 1500));

    let participants = new Set();
    let reactedUsers = new Set();
    let starUsers = new Set();

    for (const m of sessionMessages) {
      participants.add(m.author.id);

      for (const r of m.reactions.cache.values()) {
        const users = await r.users.fetch();

        users.forEach(u => {
          if (u.bot) return;

          if (u.id === m.author.id && r.emoji.name === "⭐") {
            starUsers.add(u.id);
          }

          reactedUsers.add(u.id);
        });
      }
    }

    let total = participants.size;
    let valid = 0;
    let invalid = 0;

    participants.forEach(id => {
      // ⭐ = automatiquement à jour
      if (starUsers.has(id)) {
        valid++;
        return;
      }

      if (reactedUsers.has(id)) valid++;
      else invalid++;
    });

    let winner = null;
    let max = 0;

    for (const m of sessionMessages) {
      let count = 0;

      for (const r of m.reactions.cache.values()) {
        const users = await r.users.fetch();
        count += users.filter(u => !u.bot && u.id !== m.author.id).size;
      }

      if (count > max) {
        max = count;
        winner = m.author;
      }
    }

    if (winner) {
      trophyUser = winner.id;
      trophyExpire = Date.now() + 24 * 60 * 60 * 1000;
    }

    await channel.send({
      files: ["https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"]
    });

    await channel.send({
      content: `🛑 **SESSION TERMINÉE**
👥 **${total} participants**
⭐ ${starUsers.size}
🏆 ${winner ? `<@${winner.id}>` : "Personne"}
✅ ${valid} à jour
❌ ${invalid} pas à jour`,
      components: [getButtons()]
    });

    // 🔒 ACTIVER LE BLOCAGE
    pauseBetween = true;

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
