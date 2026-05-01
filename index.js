const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = "1496696155541864633";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let sessionActive = false;
let sessionRunning = false;

// ⏱️ format temps
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// 🔥 READY + AUTO START
client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = client.channels.cache.get(CHANNEL_ID);

  if (!channel) {
    console.log("❌ Channel introuvable");
    return;
  }

  // 🚀 Lancement automatique
  setTimeout(() => {
    sessionActive = true;
    console.log("🚀 Session auto lancée");
    runLoop(channel);
  }, 3000);
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

    // ⏱️ COMPTEUR
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

    // 🛑 STOP
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
