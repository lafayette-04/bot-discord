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
let controlMessage = null;

// ⏱️ format
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// 🎛️ bouton
function getButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("start").setLabel("START").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("stop").setLabel("STOP").setStyle(ButtonStyle.Danger)
  );
}

// 🔥 READY
client.once('clientReady', async () => {
  const channel = client.channels.cache.get(CHANNEL_ID);

  // supprimer anciens boutons
  const messages = await channel.messages.fetch({ limit: 20 });
  const old = messages.find(m => m.author.id === client.user.id && m.components.length > 0);
  if (old) await old.delete().catch(() => {});

  // créer bouton
  controlMessage = await channel.send({
    content: "🎛️ **Contrôle des sessions (admin)**",
    components: [getButtons()]
  });
});

// 🔘 interaction
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.user.id !== OWNER_ID) {
    return interaction.reply({ content: "❌ Pas autorisé", ephemeral: true });
  }

  const channel = client.channels.cache.get(CHANNEL_ID);

  if (interaction.customId === "start") {
    sessionActive = true;
    interaction.reply({ content: "🚀 Sessions lancées", ephemeral: true });
    runLoop(channel);
  }

  if (interaction.customId === "stop") {
    sessionActive = false;
    interaction.reply({ content: "🛑 Sessions arrêtées", ephemeral: true });
  }
});

// 📥 capture liens
client.on("messageCreate", message => {
  if (!sessionActive) return;
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;

  if (message.content.includes("http")) {
    sessionMessages.push(message);
  }
});

// 🔁 LOOP
async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    sessionMessages = [];

    let timeLeft = 60;

    // 📸 IMAGE
    await channel.send({
      files: [{ attachment: "https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png" }]
    });

    let msg = await channel.send({
      content: `💎 SESSION ARTICLE (1 minute)

🕒 Temps restant : 01:00`
    });

    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit({
        content: `💎 SESSION ARTICLE (1 minute)

🕒 Temps restant : ${formatTime(timeLeft)}`
      });
    }

    if (!sessionActive) break;

    await new Promise(r => setTimeout(r, 2000));

    // 📊 stats
    let participants = new Set();
    let reacted = new Set();

    for (const m of sessionMessages) {
      participants.add(m.author.id);

      for (const r of m.reactions.cache.values()) {
        const users = await r.users.fetch();
        users.forEach(u => { if (!u.bot) reacted.add(u.id); });
      }
    }

    let total = participants.size;
    let valid = 0;
    let invalid = 0;

    participants.forEach(id => {
      reacted.has(id) ? valid++ : invalid++;
    });

    await channel.send({
      content: `🛑 SESSION TERMINÉE

👥 ${total} participants
⭐ ${valid}
🏆 ${invalid}

✅ ${valid}
❌ ${invalid}`
    });

    await new Promise(r => setTimeout(r, 30000));

    // 🔥 RAMÈNE LE BOUTON EN BAS
    if (controlMessage) {
      try { await controlMessage.delete(); } catch {}
    }

    controlMessage = await channel.send({
      content: "🎛️ **Contrôle des sessions (admin)**",
      components: [getButtons()]
    });
  }

  sessionRunning = false;
}

client.login(TOKEN);
