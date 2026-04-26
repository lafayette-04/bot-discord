const express = require('express');
const app = express();

app.get('/', (req, res) => {
res.send('Bot en ligne');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Serveur web actif sur ' + PORT));
