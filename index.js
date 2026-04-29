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

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 👉 DEBUG (important pour voir si ça marche)
  console.log("Message reçu :", message.content);

  // ▶️ START
  if (message.content === "!start") {
    console.log("🔥 Commande !start détectée");

    if (sessionActive) {
      return message.reply("❌ Une session est déjà en cours");
    }

    sessionActive = true;

    const channel = await client.channels.fetch(CHANNEL_ID);

    message.reply("✅ Session lancée");

    loopSession(channel);
  }

  // ⏹ STOP
  if (message.content === "!stop") {
    sessionActive = false;
    message.reply("🛑 Session arrêtée");
  }
});

async function loopSession(channel) {
  if (!sessionActive) return;

  // 🟢 SESSION
  const embedStart = new EmbedBuilder()
    .setTitle("💎 SESSION ARTICLE")
    .setDescription("Poste ton article et like les autres ❤️\n⏱️ 10 minutes chrono\n🚀 Sois actif !")
    .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
    .setColor("#ff7b00");

  await channel.send({ embeds: [embedStart] });

  console.log("🟢 SESSION envoyée");

  // ⏱️ 10 minutes
  setTimeout(async () => {
    if (!sessionActive) return;

    // 🔴 STOP
    const embedStop = new EmbedBuilder()
      .setTitle("🛑 SESSION STOP")
      .setDescription("Session terminée ❌")
      .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
      .setColor("#ff0000");

    await channel.send({ embeds: [embedStop] });

    console.log("🔴 STOP envoyé");

    // 🔁 relance après 15 sec
    setTimeout(() => {
      if (sessionActive) {
        console.log("🔁 Nouvelle session");
        loopSession(channel);
      }
    }, 15000);

  }, 10 * 60 * 1000);
}

client.login(process.env.TOKEN);
