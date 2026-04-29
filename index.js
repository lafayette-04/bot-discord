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
const SESSION_TIME = 2 * 60 * 1000; // 2 minutes (test)
const BREAK_TIME = 15 * 1000; // 15 secondes

let sessionActive = false;
let sessionRunning = false;
let interval = null;

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  // ▶️ START
  if (message.content === "!start") {

    if (sessionRunning) {
      return message.reply("❌ Session déjà en cours !");
    }

    sessionActive = true;
    sessionRunning = true;

    startSession(message.channel);
  }

  // 🛑 STOP
  if (message.content === "!stop") {
    sessionActive = false;
    sessionRunning = false;
    clearInterval(interval);
    message.reply("🛑 Session arrêtée !");
  }
});

// 🔁 SESSION
async function startSession(channel) {

  if (!sessionActive) return;

  let timeLeft = SESSION_TIME / 1000;

  const embedStart = new EmbedBuilder()
    .setTitle("💎 SESSION ARTICLE")
    .setDescription(`Poste ton article et like les autres ❤️\n⏱️ Temps restant : **${timeLeft}s**\n🚀 Sois actif !`)
    .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
    .setColor("#ff7b00");

  const msg = await channel.send({ embeds: [embedStart] });

  // ⏱️ COMPTEUR LIVE
  interval = setInterval(async () => {
    if (!sessionActive) return clearInterval(interval);

    timeLeft -= 5;

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const updatedEmbed = new EmbedBuilder()
      .setTitle("💎 SESSION ARTICLE")
      .setDescription(`Poste ton article et like les autres ❤️\n⏱️ Temps restant : **${timeLeft}s**\n🚀 Sois actif !`)
      .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
      .setColor("#ff7b00");

    await msg.edit({ embeds: [updatedEmbed] });

  }, 5000); // update toutes les 5 sec

  // ⏱️ FIN SESSION
  setTimeout(async () => {
    if (!sessionActive) return;

    clearInterval(interval);

    const embedStop = new EmbedBuilder()
      .setTitle("🛑 SESSION STOP")
      .setDescription("Session terminée ❌")
      .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
      .setColor("#ff0000");

    await channel.send({ embeds: [embedStop] });

    // 🔁 RELANCE
    setTimeout(() => {
      if (sessionActive) {
        startSession(channel);
      } else {
        sessionRunning = false;
      }
    }, BREAK_TIME);

  }, SESSION_TIME);
}

client.login(process.env.TOKEN);
