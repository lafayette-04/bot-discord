const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
res.send('Bot Discord actif');
});

app.listen(PORT, () => {
console.log(`Serveur web actif sur ${PORT}`);
});

// ===== DISCORD BOT =====

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

client.on('ready', () => {
console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', message => {
if (message.author.bot) return;

if (message.content === '!ping') {
message.reply('pong 🏓');
}
});

client.login(process.env.TOKEN);
