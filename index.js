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

// 📊 STATS
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
    sessionActive = true;
    interaction.reply({ content: "🚀 Session lancée", ephemeral: true });
    runLoop(interaction.channel);
  }

  if (interaction.customId === "stop") {
    sessionActive = false;
    interaction.reply({ content: "🛑 Session arrêtée", ephemeral: true });
  }
});

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  // ⛔ blocage 24h
  if (userBlocked[message.author.id] && Date.now() < userBlocked[message.author.id]) {
    return message.delete();
  }

  // 📊 COMMANDE STATS
  if (message.content.toLowerCase() === "bunny stats") {

    const stats = getUserStats(message.author.id);

    try {
      await message.author.send(`📊 **Tes statistiques ${message.author.username}**

✅ Semaine validée 🥳
🔥 ${stats.participations} participations

🎉 ${stats.trophies} bonus
⭐️ ${stats.stars} liens sans rendre
💶 0 ventes aujourd’hui
📅 0 ventes semaine`);

      await message.reply("📩 Je t’ai envoyé tes stats en privé !");
    } catch {
      await message.reply("❌ Active tes messages privés !");
    }

    return;
  }

  if (message.channel.id !== CHANNEL_ID) return;

  if (pauseBetween) return message.delete();
  if (!sessionActive) return;

  const urls = message.content.match(/https?:\/\/\S+/g);
  if (!urls) return;

  const leboncoinLinks = urls.filter(url => url.includes("leboncoin.fr"));
  if (leboncoinLinks.length === 0) return message.delete();

  const cleanLink = leboncoinLinks[0];

  if (sessionMessages.some(m => m.content.includes(cleanLink))) {
    return message.delete();
  }

  const stats = getUserStats(message.author.id);

  const isTrophyLink = message.content.startsWith("🏆");
  const isStarLink = message.content.startsWith("⭐");

  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  // 🎉 BONUS
  if (userLinks >= 1 && !isTrophyLink && !isStarLink) {
    if (stats.trophies > 0) {
      stats.trophies--;
    } else {
      try {
        await message.author.send("❌ Vous n’avez pas de bonus 🎉");
      } catch {}
      return message.delete();
    }
  }

  // ⭐ ETOILE
  if (isStarLink) {
    if (stats.stars > 0) {
      stats.stars--;
    } else {
      try {
        await message.author.send("❌ Vous n’avez pas de lien sans rendre ⭐");
      } catch {}
      return message.delete();
    }
  }

  if (message.author.id === trophyUser && Date.now() < trophyExpire) {
    if (userLinks === 1 && !isTrophyLink) return message.delete();
    if (userLinks >= 2) return message.delete();
  } else {
    if (isTrophyLink) return message.delete();
    if (userLinks >= 1 && !isStarLink) return message.delete();
  }

  if (message.content !== cleanLink && !message.content.startsWith("🏆") && !message.content.startsWith("⭐")) {
    await message.delete();
    const newMsg = await message.channel.send(cleanLink);
    sessionMessages.push(newMsg);
    return;
  }

  sessionMessages.push(message);
});

// ⚠️ le reste de ton code (runLoop etc) reste EXACTEMENT identique
client.login(TOKEN);
