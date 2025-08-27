import mineflayer from 'mineflayer';
import express from 'express';
import fetch from 'node-fetch'; // Node 18+ has global fetch

const app = express();
const PORT = process.env.PORT || 3000;

let bot;           // Mineflayer bot
let lastStatus;    // Store last fetched status

// AFK movement loop
function randomAFK() {
  if (!bot || !bot.entity) return;
  const actions = [
    () => bot.setControlState('jump', true),
    () => bot.setControlState('forward', true),
    () => bot.setControlState('back', true),
    () => bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI / 2)
  ];
  const action = actions[Math.floor(Math.random() * actions.length)];
  action();

  setTimeout(() => bot.clearControlStates(), Math.random() * 2000 + 500);
  setTimeout(randomAFK, Math.random() * 15000 + 5000);
}

// Poll /status every 10 minutes
async function pollStatus() {
  if (!bot) return;
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}/status`);
    lastStatus = await response.json();
    console.log('Status fetched at', new Date().toLocaleTimeString());
  } catch (err) {
    console.log('Error fetching status:', err.message);
  }
}

// Route to start the bot
app.get('/start-bot', (req, res) => {
  if (bot) return res.json({ success: false, message: 'Bot already started' });

  bot = mineflayer.createBot({
    host: 'XI.ECrew69.play.hosting',
    port: 23115,
    username: 'AFK_BOT',
  });

  bot.on('spawn', () => {
    console.log('Bot spawned! Starting AFK...');
    randomAFK();

    // Start polling every 10 minutes
    setInterval(pollStatus, 10 * 60 * 1000);
    pollStatus(); // immediately fetch once
    res.json({ success: true, message: 'Bot spawned and AFK started!' });
  });

  bot.on('error', (err) => console.log('Bot error:', err.message));
  bot.on('end', () => {
    console.log('Bot disconnected');
    bot = null;
  });
});

// Route to get last stored status
app.get('/last-status', (req, res) => {
  if (!lastStatus) return res.json({ error: 'No status fetched yet' });
  res.json(lastStatus);
});

// Route to check bot status immediately
app.get('/status', (req, res) => {
  if (!bot) return res.json({ error: 'Bot not started yet' });
  res.json({
    username: bot.username,
    health: bot.health,
    food: bot.food,
    position: bot.entity ? bot.entity.position : null
  });
});

app.listen(PORT, () => {
  console.log(`Webserver running on port ${PORT}`);
});
