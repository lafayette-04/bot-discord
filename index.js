const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CHANNEL_ID = "1496696155541864633";

// ⚙️ CONFIG
const SESSION_TIME = 2 * 60; // 2 minutes (en secondes)
const BREAK_TIME = 15 * 1000;

let sessionActive = false;
let currentSession = null;

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  if (message.content === "!start") {

    if (sessionActive) {
      return message.reply("❌ Session déjà en cours !");
    }

    sessionActive = true;
    currentSession = startSession(message.channel);
  }

  if (message.content === "!stop") {
    sessionActive = false;

    if (currentSession) {
      clearInterval(currentSession.interval);
      clearTimeout(currentSession.timeout);
    }

    message.reply("🛑 Session arrêtée !");
  }
});

// ⏱️ FORMAT 09:59
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 🔁 SESSION
function startSession(channel) {

  let timeLeft = SESSION_TIME;
  let session = {};

  (async () => {

    const embed = new EmbedBuilder()
      .setTitle("💎 SESSION ARTICLE")
      .setDescription(`Poste ton article et like les autres ❤️\n⏱️ Temps restant : **${formatTime(timeLeft)}**\n🚀 Sois actif !`)
      .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
      .setColor("#ff7b00");

    const msg = await channel.send({ embeds: [embed] });

    // ⏱️ COMPTEUR CHAQUE SECONDE
    session.interval = setInterval(async () => {

      if (!sessionActive) return clearInterval(session.interval);

      timeLeft--;

      if (timeLeft <= 0) return;

      const updated = new EmbedBuilder()
        .setTitle("💎 SESSION ARTICLE")
        .setDescription(`Poste ton article et like les autres ❤️\n⏱️ Temps restant : **${formatTime(timeLeft)}**\n🚀 Sois actif !`)
        .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
        .setColor("#ff7b00");

      await msg.edit({ embeds: [updated] });

    }, 1000);

    // ⏱️ FIN
    session.timeout = setTimeout(async () => {

      if (!sessionActive) return;

      clearInterval(session.interval);

      const embedStop = new EmbedBuilder()
        .setTitle("🛑 SESSION STOP")
        .setDescription("Session terminée ❌")
        .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
        .setColor("#ff0000");

      await channel.send({ embeds: [embedStop] });

      // 🔁 RELANCE
      setTimeout(() => {
        if (sessionActive) {
          currentSession = startSession(channel);
        }
      }, BREAK_TIME);

    }, SESSION_TIME * 1000);

  })();

  return session;
}

client.login(process.env.TOKEN);
