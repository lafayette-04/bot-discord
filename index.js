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

  if (message.channel.id !== CHANNEL_ID) return;
  if (pauseBetween) return message.delete();
  if (!sessionActive) return;

  const content = message.content.trim();

  // 🔒 Autorise uniquement : emoji optionnel + lien Leboncoin
  const regex = /^(⭐|🏆|🎉)?\s*https?:\/\/(www\.)?leboncoin\.fr\/.+$/;

  if (!regex.test(content)) {
    return message.delete();
  }

  const link = content.replace(/^(⭐|🏆|🎉)?\s*/, "");

  const stats = getUserStats(message.author.id);

  const isStar = content.startsWith("⭐");
  const isTrophy = content.startsWith("🏆");
  const isBonus = content.startsWith("🎉");

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

  // 🎉 (2e lien)
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

  // 🔥 CLEAN MESSAGE (AVATAR CONSERVÉ)
  let finalContent = link;

  if (isStar) finalContent = "⭐ " + link;
  if (isTrophy) finalContent = "🏆 " + link;
  if (isBonus) finalContent = "🎉 " + link;

  if (content !== finalContent) {
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
      content: `💎 **SESSION ARTICLE**
⏱️ 01:00
🎉 ⭐ 🏆 autorisés`
    });

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit({
        content: `💎 **SESSION ARTICLE**
⏱️ ${formatTime(timeLeft)}
🎉 ⭐ 🏆 autorisés`
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
