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

function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// 🎛️ boutons
function getButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("start").setLabel("START").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("stop").setLabel("STOP").setStyle(ButtonStyle.Danger)
  );
}

// READY
client.once('clientReady', async () => {
  console.log(`✅ ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);

  await channel.send({
    content: "🎛️ **Contrôle des sessions (admin)**",
    components: [getButtons()]
  });
});

// 📥 capture des liens
client.on("messageCreate", message => {
  if (!sessionActive) return;
  if (message.channel.id !== CHANNEL_ID) return;
  if (message.author.bot) return;

  if (message.content.includes("http")) {
    sessionMessages.push(message);
  }
});

// 🎛️ boutons
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

// 🔁 LOOP
async function runLoop(channel) {
  if (sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    sessionMessages = [];

    let timeLeft = 60;

    // 📸 IMAGE START
    await channel.send({
      files: [{
        attachment: "https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png"
      }]
    });

    let msg = await channel.send({
      content: `💎 **SESSION ARTICLE (1 minute)**

🕒 Temps restant : **01:00**
🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`
    });

    // ⏱️ TIMER
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      await msg.edit({
        content: `💎 **SESSION ARTICLE (1 minute)**

🕒 Temps restant : **${formatTime(timeLeft)}**
🎉 ⭐ et 🏆 autorisés

Pense à réagir aux liens des autres 🧡`
      });
    }

    if (!sessionActive) break;

    await new Promise(r => setTimeout(r, 3000));

    // 📊 CALCUL SIMPLE
    let participants = new Set();
    let reactedUsers = new Set();

    for (const msg of sessionMessages) {
      participants.add(msg.author.id);

      for (const reaction of msg.reactions.cache.values()) {
        const users = await reaction.users.fetch();

        users.forEach(user => {
          if (!user.bot) {
            reactedUsers.add(user.id);
          }
        });
      }
    }

    let total = participants.size;

    let valid = 0;
    let invalid = 0;

    participants.forEach(id => {
      if (reactedUsers.has(id)) {
        valid++;
      } else {
        invalid++;
      }
    });

    // 📸 IMAGE STOP
    await channel.send({
      files: [{
        attachment: "https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png"
      }]
    });

    let next = 30;

    let stopMsg = await channel.send({
      content: `🛑 **SESSION TERMINÉE**

👥 ${total} participants
⭐ ${valid}
🏆 ${invalid}

✅ ${valid} à jour
❌ ${invalid} pas à jour

⏳ Prochaine session dans : **00:30**`
    });

    // ⏱️ NEXT TIMER
    while (next > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      next--;

      await stopMsg.edit({
        content: `🛑 **SESSION TERMINÉE**

👥 ${total} participants
⭐ ${valid}
🏆 ${invalid}

✅ ${valid} à jour
❌ ${invalid} pas à jour

⏳ Prochaine session dans : **${formatTime(next)}**`
      });
    }
  }

  sessionRunning = false;
}

// ⏰ AUTO (09h → 01h)
setInterval(() => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if (h === 9 && m === 0 && !sessionActive) {
    sessionActive = true;
    const channel = client.channels.cache.get(CHANNEL_ID);
    runLoop(channel);
  }

  if (h === 1 && m === 0) {
    sessionActive = false;
  }

}, 60000);

client.login(TOKEN);
