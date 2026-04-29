const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CHANNEL_ID = "1496696155541864633";

let sessionActive = false;
let sessionRunning = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === '.start') {
    if (sessionActive) {
      return message.reply("⚠️ Session déjà active");
    }

    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
      return message.reply("❌ Channel introuvable");
    }

    sessionActive = true;
    message.reply("✅ Session lancée");

    runLoop(channel);
  }

  if (message.content === '.stop') {
    sessionActive = false;
    sessionRunning = false;
    message.reply("🛑 Session arrêtée");
  }
});

async function runLoop(channel) {
  if (!sessionActive || sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    let timeLeft = 60;

    const embedStart = new EmbedBuilder()
      .setTitle("💎 SESSION ARTICLE")
      .setDescription("Poste ton article et like les autres ❤️\n🚀 Sois actif !")
      .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
      .setColor("#ff7b00");

    let msg;
    try {
      msg = await channel.send({
        embeds: [embedStart],
        content: `🤍 **Session article**  
🕒 Temps restant : **01:00**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
      });
    } catch (err) {
      console.log("Erreur envoi message:", err);
      break;
    }

    // ⏱️ COMPTE À REBOURS
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          embeds: [embedStart],
          content: `🤍 **Session article**  
🕒 Temps restant : **${formatTime(timeLeft)}**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
        });
      } catch (err) {
        console.log("Erreur edit:", err);
      }
    }

    if (!sessionActive) break;

    // 🔴 STOP (modifie le même message)
    const embedStop = new EmbedBuilder()
      .setTitle("🛑 SESSION STOP")
      .setDescription("Session terminée ❌")
      .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
      .setColor("#ff0000");

    try {
      await msg.edit({
        embeds: [embedStop],
        content: `🛑 **Session terminée**  
⏳ Prochaine dans 25 secondes`
      });
    } catch (err) {
      console.log("Erreur STOP:", err);
    }

    // ⏳ pause 25 sec
    await new Promise(r => setTimeout(r, 25000));
  }

  sessionRunning = false;
}

// 🔐 IMPORTANT (Railway)
client.login(process.env.TOKEN);
