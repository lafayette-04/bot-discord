const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  WebhookClient
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1496696155541864633";
const OWNER_ID = "872925370314260490";

// 🔥 MET TON WEBHOOK ICI
const webhook = new WebhookClient({
  url: "WEBHOOK_URL"
});

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

  if (message.channel.id !== CHANNEL_ID) return;

  if (pauseBetween) return message.delete();
  if (!sessionActive) return;

  const urls = message.content.match(/https?:\/\/\S+/g);
  if (!urls) return;

  const leboncoinLink = urls.find(url => url.includes("leboncoin.fr"));
  if (!leboncoinLink) return message.delete();

  const cleanLink = leboncoinLink;

  const stats = getUserStats(message.author.id);

  const isTrophyLink = message.content.startsWith("🏆");
  const isStarLink = message.content.startsWith("⭐");

  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  if (isStarLink) {
    if (stats.stars > 0) stats.stars--;
    else {
      try { await message.author.send("❌ Vous n’avez pas de lien sans rendre ⭐"); } catch {}
      return message.delete();
    }
  }

  if (userLinks >= 1 && !isStarLink && !isTrophyLink) {
    if (stats.trophies > 0) stats.trophies--;
    else {
      try { await message.author.send("❌ Vous n’avez pas de bonus 🎉"); } catch {}
      return message.delete();
    }
  }

  if (message.author.id === trophyUser && Date.now() < trophyExpire) {
    if (userLinks === 1 && !isTrophyLink) return message.delete();
    if (userLinks >= 2) return message.delete();
  } else {
    if (isTrophyLink) return message.delete();
    if (userLinks >= 2) return message.delete();
  }

  // 🔥 WEBHOOK CLEAN
  const isClean =
    message.content.trim() === cleanLink ||
    message.content.startsWith("⭐") ||
    message.content.startsWith("🏆") ||
    message.content.startsWith("🎉");

  if (!isClean) {
    await message.delete();

    const sent = await webhook.send({
      content: cleanLink,
      username: message.member?.displayName || message.author.username,
      avatarURL: message.author.displayAvatarURL()
    });

    sessionMessages.push({
      author: message.author,
      content: cleanLink,
      reactions: sent.reactions,
      id: sent.id
    });

    return;
  }

  sessionMessages.push(message);
});

// 🔁 LOOP (inchangé)
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

    for (const m of sessionMessages) {
      const stats = getUserStats(m.author.id);
      stats.participations++;

      if (stats.participations % 2 === 0) {
        stats.trophies++;
      }

      participants.add(m.author.id);
    }

    await channel.send({
      files: ["https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"]
    });

    await channel.send({
      content: `🛑 **SESSION TERMINÉE**
👥 ${participants.size} participants`,
      components: [getButtons()]
    });

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
