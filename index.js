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
let sessionRunning = false; // empêche double loop

client.once('ready', async () => {
console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
if (message.author.bot) return;

const content = message.content.toLowerCase();

// ▶️ START
if (content === "!start") {
if (sessionActive) {
return message.reply("❌ Une session est déjà en cours");
}

const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null);
if (!channel) return message.reply("❌ Channel introuvable");

sessionActive = true;
sessionRunning = true;

message.reply("✅ Session lancée");
loopSession(channel);
}

// ⏹ STOP
if (content === "!stop") {
sessionActive = false;
sessionRunning = false;
message.reply("🛑 Session arrêtée");
}
});

async function loopSession(channel) {
if (!sessionActive || !sessionRunning) return;

try {
// 🟢 SESSION
const embedStart = new EmbedBuilder()
.setTitle("💎 SESSION ARTICLE")
.setDescription("Poste ton article et like les autres ❤️\n⏱️ 10 minutes chrono\n🚀 Sois actif !")
.setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
.setColor("#ff7b00");

await channel.send({ embeds: [embedStart] });

// ⏱️ attendre 10 min
setTimeout(async () => {
if (!sessionActive) return;

const embedStop = new EmbedBuilder()
.setTitle("🛑 SESSION STOP")
.setDescription("Session terminée ❌")
.setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
.setColor("#ff0000");

await channel.send({ embeds: [embedStop] });

// 🔁 relance après 15 sec
setTimeout(() => {
if (sessionActive) loopSession(channel);
}, 15000);

}, 10 * 60 * 1000);

} catch (err) {
console.error("Erreur bot :", err);
}
}

client.login(process.env.TOKEN);
