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
    GatewayIntentBits.MessageContent
  ]
});

let sessionActive = false;
let sessionRunning = false;
let sessionMessages = [];

// ⏱️ format temps
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
      .setLabel("START")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("stop")
      .setLabel("STOP")
      .setStyle(ButtonStyle.Danger)
  );
}

// 🔥 READY
client.once('clientReady', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel) return;

  await channel.send({
    content: "🎛️ **Contrôle des sessions (admin)**",
    components: [getButtons()]
  });
});


// 📥 CAPTURE LIENS
client.on("messageCreate", message => {
  if (!sessionActive) return;
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;

  if (message.content.includes("http")) {
    sessionMessages.push(message);
  }
});


// 🎛️ BOUTONS
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Pas autorisé", ephemeral: true });
  }

  const channel = client.channels.cache.get(CHANNEL_ID);

  if (interaction.customId === "start") {
    if (!sessionActive) {
      sessionActive = true;
      interaction.reply({ content: "🚀 Sessions lancées", ephemeral: true });
      runLoop(channel);
    }
  }

  if (interaction.customId === "stop") {
    sessionActive = false;
    interaction.reply({ content: "🛑 Sessions arrêtées", ephemeral: true });
  }
});


// 🔁 LOOP
async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    sessionMessages = []; // reset

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

    // ⏱️ compteur (SANS image pour éviter clignotement)
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

    if (!sessionActive) break;

    // ⏳ laisse le temps aux réactions
    await new Promise(r => setTimeout(r, 3000));

    // 📊 CALCUL
    let users = new Set();
    let starCount = 0;
    let trophyCount = 0;
    let valid = 0;
    let invalid = 0;

    for (const msg of sessionMessages) {
      users.add(msg.author.id);

      const reactions = msg.reactions.cache;

      if (reactions.get("⭐")) starCount++;
      if (reactions.get("🏆")) trophyCount++;
      if (reactions.get("✅")) valid++;
      if (reactions.get("❌")) invalid++;
    }

    let total = users.size;

    // 🛑 STOP + STATS
    let next = 30;

    let stopMsg = await channel.send({
      content: `🛑 **SESSION TERMINÉE**

👥 ${total} participants
⭐ ${starCount}
🏆 ${trophyCount}

✅ ${valid} à jour
❌ ${invalid} pas à jour

⏳ Prochaine session dans : **00:30**`,
      files: [{
        attachment: "https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"
      }]
    });

    // ⏱️ compteur prochaine session (sans image)
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

⏳ Prochaine session dans : **${formatTime(next)}**`
        });
      } catch {}
    }
  }

  sessionRunning = false;
}


// ⏰ HORAIRES AUTO
setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if (h === 9 && m === 0) {
    if (!sessionActive) {
      sessionActive = true;
      const channel = client.channels.cache.get(CHANNEL_ID);
      runLoop(channel);
      console.log("⏰ AUTO START");
    }
  }

  if (h === 1 && m === 0) {
    sessionActive = false;
      console.log("⏰ AUTO STOP");
  }

}, 60000);


// 🚀 LOGIN
client.login(TOKEN);
