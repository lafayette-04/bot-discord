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
let controlMessage = null;

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
  if (!channel) return console.log("❌ Channel introuvable");

  // supprimer anciens boutons
  const messages = await channel.messages.fetch({ limit: 20 });
  const old = messages.find(m => m.author.id === client.user.id && m.components.length > 0);
  if (old) await old.delete().catch(() => {});

  // envoyer 1 seul bouton
  controlMessage = await channel.send({
    content: "🎛️ **Contrôle des sessions (admin)**",
    components: [getButtons()]
  });
});


// 🎛️ interaction boutons
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Pas autorisé", ephemeral: true });
  }

  if (interaction.customId === "start") {
    if (!sessionActive) {
      sessionActive = true;
      interaction.reply({ content: "🚀 Sessions lancées", ephemeral: true });

      const channel = client.channels.cache.get(CHANNEL_ID);
      runLoop(channel);
    } else {
      interaction.reply({ content: "⚠️ Déjà actif", ephemeral: true });
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

    // ⏱️ compteur session
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          content: `💎 **SESSION ARTICLE (1 minute)**

🕒 Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`,
          files: [{
            attachment: "https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"
          }]
        });
      } catch {}
    }

    if (!sessionActive) break;

    // 🛑 STOP + timer prochain
    let next = 30;

    let stopMsg = await channel.send({
      content: `🛑 **SESSION TERMINÉE**

⏳ Prochaine session dans : **00:30**`,
      files: [{
        attachment: "https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"
      }]
    });

    while (next > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      next--;

      try {
        await stopMsg.edit({
          content: `🛑 **SESSION TERMINÉE**

⏳ Prochaine session dans : **${formatTime(next)}**`,
          files: [{
            attachment: "https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"
          }]
        });
      } catch {}
    }
  }

  sessionRunning = false;
}


// ⏰ HORAIRES AUTO (H24)
setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // START 09:00
  if (h === 9 && m === 0) {
    if (!sessionActive) {
      console.log("⏰ AUTO START 09:00");
      sessionActive = true;

      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) runLoop(channel);
    }
  }

  // STOP 01:00
  if (h === 1 && m === 0) {
    console.log("⏰ AUTO STOP 01:00");
    sessionActive = false;
  }

}, 60000);


// 🚀 LOGIN
client.login(TOKEN);
