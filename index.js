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

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  if (message.content === "!start") {

    if (sessionRunning) {
      return message.channel.send("❌ Session déjà en cours !");
    }

    sessionActive = true;
    sessionRunning = true;

    loopSession(message.channel);
  }

  if (message.content === "!stop") {
    sessionActive = false;
    sessionRunning = false;
    message.reply("🛑 Session arrêtée");
  }
});

async function loopSession(channel) {
  if (!sessionActive || !sessionRunning) return;

  try {

    // 🟢 START
    const embedStart = new EmbedBuilder()
      .setTitle("💎 SESSION ARTICLE")
      .setDescription("Poste ton article et like les autres ❤️\n⏱️ 10 minutes chrono\n🚀 Sois actif !")
      .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
      .setColor("#ff7b00");

    await channel.send({ embeds: [embedStart] });

    // ⏱️ 10 min
    setTimeout(async () => {
      if (!sessionActive) return;

      // 🔴 STOP
      const embedStop = new EmbedBuilder()
        .setTitle("🛑 SESSION STOP")
        .setDescription("Session terminée ❌")
        .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
        .setColor("#ff0000");

      await channel.send({ embeds: [embedStop] });

      // 🔁 RESTART après 15 sec
      setTimeout(() => {
        if (sessionActive) {
          loopSession(channel);
        } else {
          sessionRunning = false;
        }
      }, 15000);

    }, 600000); // 10 minutes

  } catch (err) {
    console.error(err);
    sessionRunning = false;
  }
}

client.login(process.env.TOKEN);
