import mineflayer from 'mineflayer';
import express from 'express';
import fetch from 'node-fetch'; // Node 18+ has global fetch
import dotenv from 'dotenv'
import ulid from 'ulid'

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

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
  const name = ulid();
  bot = mineflayer.createBot({
    host: 'XIE_Crew69.aternos.me',
    port: 53195,
    username: name,
  });

  bot.on('spawn', () => {
    console.log('Bot spawned! Starting AFK...');
    randomAFK();

    // Start polling every 10 minutes
    setInterval(pollStatus, 10 * 60 * 1000);
    pollStatus(); // immediately fetch once
    res.json({ success: true, name: name, message: 'Bot spawned and AFK started!' });
  });

  bot.on('error', async (err) => {
    console.log('Bot error:', err.message)
    await fetch(`http://127.0.0.1:${PORT}/start-bot`);
  });
  bot.on('end', async () => {
    console.log('Bot disconnected');
    bot = null;
    await fetch(`http://127.0.0.1:${PORT}/start-bot`);
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

app.get('/say/:msg',basicAuth ,(req, res) => {
  if (!bot) return res.json({ error: 'Bot not started yet' });
  bot.chat(`Message From The API: ${req.params.msg}`)
  res.json({success: "truee",message:"Msg Send"})
})

app.listen(PORT, async () => {
  console.log(`Webserver running on port ${PORT}`);
  await fetch(`http://127.0.0.1:${PORT}/start-bot`);
});


setTimeout(async () => {
  if (!bot) return;
  try {
    await fetch(`http://127.0.0.1:${PORT}/start-bot`);
    const response = await fetch(`http://127.0.0.1:${PORT}/status`);
    const data = await response.json()
    console.log('Status:',data,'\n\nStatus fetched at', new Date().toLocaleTimeString());
  } catch (err) {
    console.log('Error fetching status:', err.message);
  }
}, 5 * 60 * 1000)


function basicAuth(req, res, next) {
  const auth = req.headers["authorization"];

  if (!auth) {
    res.set("WWW-Authenticate", 'Basic realm="Restricted Area"');
    return res.status(401).send("Authentication required");
  }

  // Decode base64
  const b64auth = auth.split(" ")[1];
  const [user, pass] = Buffer.from(b64auth, "base64").toString().split(":");

  // Check user/pass
  if (user === process.env.USER && pass === process.env.PASS) {
    return next();
  }

  res.set("WWW-Authenticate", 'Basic realm="Restricted Area"');
  return res.status(401).send("Unauthorized");
}