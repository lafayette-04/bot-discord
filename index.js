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

  if (message.author.bot) return;

  if (userBlocked[message.author.id] && Date.now() < userBlocked[message.author.id]) {
    return message.delete();
  }

  if (message.content.toLowerCase() === "bunny stats") {

    const stats = getUserStats(message.author.id);

    try {
      await message.author.send(`📊 **Tes statistiques ${message.author.username}**

🔥 ${stats.participations} participations
🎉 ${stats.trophies} bonus
⭐ ${stats.stars} liens sans rendre`);

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
  if (!urls) return message.delete();

  const link = urls.find(url => url.includes("leboncoin.fr"));
  if (!link) return message.delete();

  const stats = getUserStats(message.author.id);

  const isStar = message.content.startsWith("⭐");
  const isTrophy = message.content.startsWith("🏆");
  const isBonus = message.content.startsWith("🎉");

  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  // ⭐
  if (isStar) {
    if (stats.stars > 0) {
      stats.stars--;
    } else {
      try { await message.author.send("❌ Vous n’avez pas de lien sans rendre ⭐"); } catch {}
      return message.delete();
    }
  }

  // 🎉
  if (userLinks >= 1 && !isStar && !isTrophy) {
    if (stats.trophies > 0) {
      stats.trophies--;
    } else {
      try { await message.author.send("❌ Vous n’avez pas de bonus 🎉"); } catch {}
      return message.delete();
    }
  }

  // limites
  if (message.author.id === trophyUser && Date.now() < trophyExpire) {
    if (userLinks === 1 && !isTrophy) return message.delete();
    if (userLinks >= 2) return message.delete();
  } else {
    if (isTrophy) return message.delete();
    if (userLinks >= 2) return message.delete();
  }

  // 🔥 CLEAN SANS SUPPRIMER (AVATAR OK)
  let finalContent = link;

  if (isStar) finalContent = "⭐ " + link;
  if (isTrophy) finalContent = "🏆 " + link;
  if (isBonus) finalContent = "🎉 " + link;

  if (message.content.trim() !== finalContent) {
    try {
      await message.edit(finalContent);
    } catch {}
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
🎉 ⭐ et 🏆 autorisés`
    });

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit({
        content: `💎 **SESSION ARTICLE (1 minute)**
⏱️ Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐ et 🏆 autorisés`
      });
    }

    if (!sessionActive) break;

    await channel.send({
      files: ["https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"]
    });

    await channel.send({
      content: `🛑 **SESSION TERMINÉE**`,
      components: [getButtons()]
    });

    pauseBetween = true;
  }

  sessionRunning = false;
}

client.login(TOKEN);
