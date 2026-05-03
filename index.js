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
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages
  ]
});

let sessionActive = false;
let sessionRunning = false;
let sessionMessages = [];

let trophyUser = null;
let trophyExpire = 0;

let pauseBetween = false;

let userStats = {};
let userWarnings = {};
let userBlocked = {};

function getUserStats(id) {
  if (!userStats[id]) {
    userStats[id] = {
      participations: 0,
      stars: 0,
      trophies: 0
    };
  }
  return userStats[id];
}

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
    await interaction.deferReply({ ephemeral: true });
    sessionActive = true;
    await interaction.editReply("🚀 Session lancée");
    runLoop(interaction.channel);
  }

  if (interaction.customId === "stop") {
    await interaction.deferReply({ ephemeral: true });
    sessionActive = false;
    await interaction.editReply("🛑 Session arrêtée");
  }
});

client.on("messageCreate", async message => {

  // ❗ NE JAMAIS SUPPRIMER LES MESSAGES DU BOT
  if (message.author.bot) return;

  if (userBlocked[message.author.id] && Date.now() < userBlocked[message.author.id]) {
    return message.delete();
  }

  if (message.content.toLowerCase() === "bunny stats") {
    const stats = getUserStats(message.author.id);

    try {
      await message.author.send(`📊 Tes stats :
🔥 ${stats.participations}
🎉 ${stats.trophies}
⭐ ${stats.stars}`);
      await message.reply("📩 Envoyé en privé");
    } catch {}
    return;
  }

  if (message.channel.id !== CHANNEL_ID) return;
  if (pauseBetween) return message.delete();
  if (!sessionActive) return;

  const urls = message.content.match(/https?:\/\/\S+/g);
  if (!urls) return message.delete();

  const link = urls.find(u => u.includes("leboncoin.fr"));
  if (!link) return message.delete();

  const stats = getUserStats(message.author.id);

  const isStar = message.content.startsWith("⭐");
  const isTrophy = message.content.startsWith("🏆");

  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  if (isStar) {
    if (stats.stars > 0) stats.stars--;
    else return message.delete();
  }

  if (userLinks >= 1 && !isStar && !isTrophy) {
    if (stats.trophies > 0) stats.trophies--;
    else return message.delete();
  }

  if (userLinks >= 2) return message.delete();

  sessionMessages.push(message);
});

async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    pauseBetween = false;
    sessionMessages = [];

    // ✅ IMAGE SESSION
    await channel.send({
      files: ["https://i.imgur.com/9h1Z9qW.png"]
    });

    let timeLeft = 60;

    let msg = await channel.send({
      content: `💎 SESSION ARTICLE
⏱️ 01:00`
    });

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit(`💎 SESSION ARTICLE
⏱️ ${formatTime(timeLeft)}`);
    }

    if (!sessionActive) break;

    let participants = new Set();

    for (const m of sessionMessages) {
      participants.add(m.author.id);
      const stats = getUserStats(m.author.id);
      stats.participations++;

      if (stats.participations % 2 === 0) {
        stats.trophies++;
      }
    }

    // ✅ IMAGE FIN
    await channel.send({
      files: ["https://i.imgur.com/Z6X9n3F.png"]
    });

    await channel.send({
      content: `🛑 SESSION TERMINÉE
👥 ${participants.size} participants`,
      components: [getButtons()]
    });

    pauseBetween = true;

    let next = 30;

    let nextMsg = await channel.send(`⏳ ${formatTime(next)}`);

    while (next > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      next--;
      await nextMsg.edit(`⏳ ${formatTime(next)}`);
    }
  }

  sessionRunning = false;
}

client.login(TOKEN);
