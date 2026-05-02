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

// ⚠️ WARN / BAN
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

  if (leboncoinLinks.length === 0) {
    return message.delete();
  }

  const cleanLink = leboncoinLinks[0];

  if (sessionMessages.some(m => m.content.includes(cleanLink))) {
    return message.delete();
  }

  const isTrophyLink = message.content.startsWith("🏆");

  let userLinks = sessionMessages.filter(m => m.author.id === message.author.id).length;

  if (message.author.id === trophyUser && Date.now() < trophyExpire) {
    if (userLinks === 1 && !isTrophyLink) return message.delete();
    if (userLinks >= 2) return message.delete();
  } else {
    if (isTrophyLink) return message.delete();
    if (userLinks >= 1) return message.delete();
  }

  if (message.content !== cleanLink && !message.content.startsWith("🏆")) {
    await message.delete();
    const newMsg = await message.channel.send(cleanLink);
    sessionMessages.push(newMsg);
    return;
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

    for (const m of sessionMessages) {
      participants.add(m.author.id);
    }

    // 📍 heure session
    const sessionTime = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

    let userMissing = {};

    for (const m of sessionMessages) {
      for (const userId of participants) {

        if (m.author.id === userId) continue;

        const reacted = m.reactions.cache.some(r =>
          r.users.cache.has(userId)
        );

        if (!reacted) {
          if (!userMissing[userId]) userMissing[userId] = [];
          userMissing[userId].push(m.url);
        }
      }
    }

    // 📩 DM après 2 min
    setTimeout(async () => {

      for (const userId in userMissing) {

        try {
          const user = await client.users.fetch(userId);

          await user.send(`👀 Tu n'es pas à jour sur la session **Session article** de ${sessionTime}.

Il te manque des réactions sur certains liens, mets-toi à jour, sinon tu auras un avertissement dans 10 minutes.

Liste des liens manquants :
leboncoin prestige
${userMissing[userId].join("\n")}`);

          setTimeout(async () => {

            userWarnings[userId] = (userWarnings[userId] || 0) + 1;

            await user.send(`⚠️ **Avertissement**

Tu n’étais toujours pas à jour 10 min après la fin de la session **Session article**.

Avertissements ${userWarnings[userId]} sur 3.`);

            if (userWarnings[userId] >= 3) {
              userBlocked[userId] = Date.now() + (24 * 60 * 60 * 1000);

              await user.send(`⛔ Tu es bloqué(e) dans le boost pendant 24h car tu as atteint 3 avertissements.`);
            }

          }, 10 * 60 * 1000);

        } catch {}
      }

    }, 2 * 60 * 1000);

    await channel.send({
      files: ["https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"]
    });

    await channel.send({
      content: `🛑 **SESSION TERMINÉE**
👥 **${participants.size} participants**`,
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
