const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = "1496696155541864633";

const CHANNEL_ID = "1496696155541864633";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let sessionActive = false;
let sessionRunning = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 🔥 COMMANDES SLASH
const commands = [
  new SlashCommandBuilder().setName('start').setDescription('Lancer la session'),
  new SlashCommandBuilder().setName('stop').setDescription('Arrêter la session')
].map(cmd => cmd.toJSON());

// 🔥 RESET + INSTALL COMMANDES
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log("⏳ Reset commandes...");

    // ❌ supprime anciennes globales
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );

    // ✅ ajoute sur TON serveur (instantané)
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ /start et /stop installés !");
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const channel = await client.channels.fetch(CHANNEL_ID);

  // ▶️ START
  if (interaction.commandName === 'start') {
    if (sessionActive) {
      return interaction.reply({ content: "⚠️ Session déjà active", ephemeral: true });
    }

    sessionActive = true;
    interaction.reply({ content: "✅ Session lancée", ephemeral: true });

    runLoop(channel);
  }

  // ⏹ STOP
  if (interaction.commandName === 'stop') {
    sessionActive = false;
    sessionRunning = false;

    interaction.reply({ content: "🛑 Session arrêtée", ephemeral: true });
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

    let msg = await channel.send({
      embeds: [embedStart],
      content: `🤍 **Session article**  
🕒 Temps restant : **01:00**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
    });

    // ⏱️ compteur
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

    // 🔴 STOP = nouveau message
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

client.login(TOKEN);
