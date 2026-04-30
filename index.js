const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const CHANNEL_ID = "1496696155541864633";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let sessionActive = false;
let sessionRunning = false;

// ⏱️ format temps
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 🔥 READY + COMMANDES
client.once('ready', async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log("🧹 Reset commandes...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    console.log("⚡ Installation commandes...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      {
        body: [
          {
            name: "start",
            description: "Lancer la session"
          },
          {
            name: "stop",
            description: "Arrêter la session"
          }
        ]
      }
    );

    console.log("✅ Commandes installées !");
  } catch (err) {
    console.error("❌ ERREUR COMMANDES :", err);
  }
});

// 🎮 INTERACTIONS
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
  if (!channel) return;

  if (interaction.commandName === 'start') {
    if (sessionActive) {
      return interaction.reply({ content: "⚠️ Session déjà active", ephemeral: true });
    }

    sessionActive = true;
    await interaction.reply({ content: "✅ Session lancée", ephemeral: true });

    runLoop(channel);
  }

  if (interaction.commandName === 'stop') {
    sessionActive = false;
    sessionRunning = false;

    await interaction.reply({ content: "🛑 Session arrêtée", ephemeral: true });
  }
});

// 🔁 LOOP
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

    let msg = await channel.send({
      embeds: [embedStart],
      content: `🤍 **Session article**
🕒 Temps restant : **01:00**
🎉 ⭐️ autorisés

Pense à réagir aux liens des autres 🧡`
    });

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
      } catch {}
    }

    if (!sessionActive) break;

    const embedStop = new EmbedBuilder()
      .setTitle("🛑 SESSION STOP")
      .setDescription("Session terminée ❌")
      .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
      .setColor("#ff0000");

    await channel.send({
      embeds: [embedStop],
      content: `🛑 **Session terminée**
⏳ Prochaine dans 25 secondes`
    });

    await new Promise(r => setTimeout(r, 25000));
  }

  sessionRunning = false;
}

// 🚀 LOGIN
client.login(TOKEN);
