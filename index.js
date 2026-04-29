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
let sessionMessage = null;
let interval = null;

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

// format 01:00
function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

// 🔁 LANCER SESSION
async function startSession(channel) {
  let timeLeft = 60; // 🔥 1 minute

  const embed = new EmbedBuilder()
    .setTitle("💎 SESSION ARTICLE")
    .setDescription("Poste ton article et like les autres ❤️\n🚀 Sois actif !")
    .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
    .setColor("#ff7b00");

  // si pas de message → créer
  if (!sessionMessage) {
    sessionMessage = await channel.send({
      embeds: [embed],
      content: `🤍 **Session article**  
🕒 Temps restant : **${formatTime(timeLeft)}**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
    });
  }

  interval = setInterval(async () => {
    if (!sessionActive) return;

    timeLeft--;

    if (timeLeft <= 0) {
      clearInterval(interval);

      const embedStop = new EmbedBuilder()
        .setTitle("🛑 SESSION STOP")
        .setDescription("Session terminée ❌")
        .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
        .setColor("#ff0000");

      await sessionMessage.edit({
        embeds: [embedStop],
        content: `🛑 **Session terminée**  
⏳ Prochaine dans 25 secondes`
      });

      // 🔁 relance après 25 sec
      setTimeout(() => {
        if (sessionActive) startSession(channel);
      }, 25000);

      return;
    }

    // update compteur
    await sessionMessage.edit({
      embeds: [embed],
      content: `🤍 **Session article**  
🕒 Temps restant : **${formatTime(timeLeft)}**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
    });

  }, 1000);
}

// 🎮 COMMANDES
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  if (message.content === '.start') {
    if (sessionActive) return message.reply("⚠️ Déjà lancé");

    const channel = client.channels.cache.get(CHANNEL_ID);
    sessionActive = true;

    startSession(channel);

    message.reply("✅ Session lancée !");
  }

  if (message.content === '.stop') {
    sessionActive = false;
    clearInterval(interval);

    message.reply("🛑 Session arrêtée !");
  }
});

client.login("TON_TOKEN_ICI");
