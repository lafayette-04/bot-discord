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

  if (userBlocked[message.author.id] && Date.now() < userBlocked[message.author.id]) {
    return message.delete();
  }

  if (message.content.toLowerCase() === "bunny stats") {
    const stats = getUserStats(message.author.id);

    try {
      await message.author.send(`📊 **Tes statistiques ${message.author.username}**

🔥 ${stats.participations} participations
🎉 ${stats.trophies} bonus
⭐️ ${stats.stars} liens sans rendre`);
      await message.reply("📩 Je t’ai envoyé tes stats !");
    } catch {
      await message.reply("❌ Active tes DM !");
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

  const isStarLink = message.content.startsWith("⭐");
  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  // ⭐ lien sans rendre
  if (isStarLink) {
    if (stats.stars > 0) {
      stats.stars--;
    } else {
      try { await message.author.send("❌ Vous n’avez pas de lien sans rendre ⭐"); } catch {}
      return message.delete();
    }
  }

  // 🎉 deuxième lien
  if (userLinks >= 1 && !isStarLink) {
    if (stats.trophies > 0) {
      stats.trophies--;
    } else {
      try { await message.author.send("❌ Vous n’avez pas de bonus 🎉"); } catch {}
      return message.delete();
    }
  }

  if (message.content !== cleanLink && !isStarLink) {
    await message.delete();
    const newMsg = await message.channel.send(cleanLink);
    sessionMessages.push(newMsg);
    return;
  }

  sessionMessages.push(message);
});

// 🔁 TON LOOP RESTE IDENTIQUE
async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    pauseBetween = false;
    sessionMessages = [];
    let timeLeft = 60;

    await channel.send({ files: ["https://i.ibb.co/6Jm36jvX/start.png"] });

    let msg = await channel.send(`💎 SESSION (1 min)
⏱️ ${formatTime(timeLeft)}`);

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;
      await msg.edit(`💎 SESSION (1 min)
⏱️ ${formatTime(timeLeft)}`);
    }

    if (!sessionActive) break;

    await new Promise(r => setTimeout(r, 1500));

    await channel.send({ files: ["https://i.ibb.co/j9mGMjDm/stop.png"] });

    await channel.send({
      content: `🛑 SESSION TERMINÉE`,
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
