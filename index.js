const express = require('express');
const config = require('./config');
const bot = require('./bot');

const app = express();
const PORT = config.PORT;

// Health check endpoint for Railway
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'BD SMS MASTER',
        version: '2.0.0',
        developer: 'MAINUL ISLAM',
        platform: 'Railway',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// For Railway to keep the bot alive
app.get('/ping', (req, res) => {
    res.send('Pong!');
});

app.listen(PORT, '0.0.0.0', () => {
    const year = config.getCurrentYear();
    const datetime = config.getCurrentDateTime();
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║     🔥 BD SMS MASTER BOT v2.0 - RAILWAY 🔥            ║
║                                                        ║
║     👑 Developer: MAINUL ISLAM                         ║
║     📅 Year: ${year}                                       ║
║     ⏰ Time: ${datetime}                           ║
║     📡 Status: ONLINE                                  ║
║     🌐 Port: ${PORT}                                      ║
║     🤖 Bot: Running on Railway                         ║
║                                                        ║
║     💫 Telegram: @mdmainulislaminfo                    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
});

// Error handling for Railway
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
});
