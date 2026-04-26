const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMessageReactions,
GatewayIntentBits.DirectMessages
],
});

const PREFIX = "!";

let participants = new Map();

client.on("messageCreate", async (message) => {
if (message.author.bot) return;

// Commande pour rejoindre la session
if (message.content === "!join") {
participants.set(message.author.id, []);
message.reply("✅ Tu es inscrit à la session !");
}

// Si quelqu’un envoie un lien
if (message.content.includes("http")) {
if (participants.has(message.author.id)) {
participants.get(message.author.id).push(message.id);
}
}

// Commande stats
if (message.content === "!stats") {
let txt = "📊 Stats :\n";
participants.forEach((links, user) => {
txt += `<@${user}> : ${links.length} liens\n`;
});
message.channel.send(txt);
}
});

client.login(process.env.TOKEN);
