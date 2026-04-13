const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { userVerifications, userSessions, userStats } = require('./database');
const { getWelcomeMessage, getVerifiedMenu, getAboutText, getStatusText, formatNumber } = require('./utils');
const { handleBombing } = require('./bomber');
const { APIS } = require('./apis');

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

const welcomeKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "📢 Join Channel", url: config.TELEGRAM_CHANNEL }, { text: "👥 Join Group", url: config.TELEGRAM_GROUP }],
            [{ text: "🎬 Subscribe YouTube", url: config.YOUTUBE }],
            [{ text: "✅ VERIFY & UNLOCK 🔓", callback_data: "verify" }]
        ]
    }
};

const mainMenuKeyboard = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "💣 START BOMB", callback_data: "start_bomb" }, { text: "📊 MY STATS", callback_data: "my_stats" }],
            [{ text: "👨‍💻 ABOUT DEV", callback_data: "about" }, { text: "🏓 PING", callback_data: "ping" }],
            [{ text: "🆘 HELP", callback_data: "help" }, { text: "📡 STATUS", callback_data: "status" }]
        ]
    }
};

const bombKeyboard = {
    reply_markup: {
        inline_keyboard: [[{ text: "❌ Cancel", callback_data: "cancel_bomb" }]]
    }
};

function isVerified(userId) {
    if (userId.toString() === config.ADMIN_ID) return true;
    const verified = userVerifications.get(userId);
    return verified && verified.verified === true;
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";
    const currentYear = config.getCurrentYear();
    
    userSessions.delete(chatId);
    
    if (userId.toString() === config.ADMIN_ID) {
        bot.sendMessage(chatId, `👑 *Welcome Admin ${firstName}!*\n\n🔥 You have direct access.\n💣 Use /bomb to start.`, { parse_mode: 'Markdown' });
        return;
    }
    
    const welcomeText = `*🌟 Welcome ${firstName}! 🌟*\n\n${getWelcomeMessage(firstName, currentYear)}`;
    bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown', ...welcomeKeyboard });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const currentYear = config.getCurrentYear();
    
    if (data === "verify") {
        userVerifications.set(userId, {
            channel: true,
            group: true,
            youtube: true,
            verified: true,
            verifiedAt: Date.now()
        });
        
        await bot.editMessageText(
            `*✅ VERIFICATION SUCCESSFUL! ✅*\n\n${getVerifiedMenu(currentYear)}`,
            { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', ...mainMenuKeyboard }
        );
    }
    
    else if (data === "start_bomb") {
        if (!isVerified(userId)) {
            bot.sendMessage(chatId, "*❌ You are not verified!*\n\nPlease click VERIFY button first.", { parse_mode: 'Markdown' });
            return;
        }
        userSessions.set(chatId, { step: 'number' });
        bot.sendMessage(chatId, "*💣 TARGET NUMBER*\n\n📋 Enter 11 digit number:\n\n⚡ Example: `013XXXXXXXX`", { parse_mode: 'Markdown', ...bombKeyboard });
    }
    
    else if (data === "my_stats") {
        const stats = userStats.get(userId) || { total: 0, success: 0, failed: 0 };
        const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        bot.sendMessage(chatId, 
            `*📈 YOUR STATISTICS*\n\n🔥 *Total Bombs:* \`${stats.total}\`\n✅ *Success:* \`${stats.success}\`\n❌ *Failed:* \`${stats.failed}\`\n📊 *Success Rate:* \`${rate.toFixed(1)}%\``,
            { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "about") {
        bot.sendMessage(chatId, getAboutText(config.getCurrentYear(), config.getCurrentDateTime()), { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "ping") {
        const start = Date.now();
        const msg = await bot.sendMessage(chatId, "🏓 *Pinging...*", { parse_mode: 'Markdown' });
        const latency = Date.now() - start;
        bot.editMessageText(`🏓 *PONG!*\n\n📡 Response Time: \`${latency}ms\`\n✅ Status: ONLINE`, 
            { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "help") {
        bot.sendMessage(chatId,
            `*🆘 HELP & SUPPORT*\n\n📞 *WhatsApp:* ${config.WHATSAPP}\n✈️ *Telegram:* ${config.TELEGRAM}\n🐙 *GitHub:* ${config.GITHUB}\n📧 *Email:* ${config.EMAIL}\n\n*⚡ How to use:*\n1️⃣ Click VERIFY\n2️⃣ Click START BOMB\n3️⃣ Enter 11 digit number\n4️⃣ Enter SMS count (1-50)`,
            { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "status") {
        bot.sendMessage(chatId, getStatusText(config.getCurrentYear(), config.getCurrentDateTime(), APIS.length), { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "cancel_bomb") {
        userSessions.delete(chatId);
        bot.sendMessage(chatId, "*❌ Bombing cancelled!*", { parse_mode: 'Markdown' });
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    if (text && text.startsWith('/')) return;
    
    if (userSessions.has(chatId)) {
        const session = userSessions.get(chatId);
        
        if (session.step === 'number') {
            const number = text.trim();
            if (/^\d{11}$/.test(number)) {
                session.number = number;
                session.step = 'count';
                userSessions.set(chatId, session);
                bot.sendMessage(chatId, "*🔢 SMS QUANTITY*\n\nMinimum: 1\nMaximum: 50\n\n📝 Enter amount:", { parse_mode: 'Markdown', ...bombKeyboard });
            } else {
                bot.sendMessage(chatId, "*❌ Invalid number!* Please enter 11 digits.", { parse_mode: 'Markdown' });
            }
        }
        
        else if (session.step === 'count') {
            const count = parseInt(text);
            if (count >= 1 && count <= 50) {
                userSessions.delete(chatId);
                await handleBombing(bot, chatId, userId, session.number, count);
                bot.sendMessage(chatId, "*💫 Want to bomb again?*\n\nClick START BOMB button!", { parse_mode: 'Markdown', ...mainMenuKeyboard });
            } else {
                bot.sendMessage(chatId, "*❌ Invalid count!* Please enter 1-50.", { parse_mode: 'Markdown' });
            }
        }
    }
});

bot.onText(/\/bomb/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isVerified(userId)) {
        bot.sendMessage(chatId, "*❌ You are not verified!*\n\nPlease click VERIFY button first.", { parse_mode: 'Markdown' });
        return;
    }
    
    userSessions.set(chatId, { step: 'number' });
    bot.sendMessage(chatId, "*💣 TARGET NUMBER*\n\n📋 Enter 11 digit number:\n\n⚡ Example: `013XXXXXXXX`", { parse_mode: 'Markdown', ...bombKeyboard });
});

bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const stats = userStats.get(userId) || { total: 0, success: 0, failed: 0 };
    const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
    bot.sendMessage(chatId, `*📈 YOUR STATISTICS*\n\n🔥 *Total Bombs:* \`${stats.total}\`\n✅ *Success:* \`${stats.success}\`\n❌ *Failed:* \`${stats.failed}\`\n📊 *Success Rate:* \`${rate.toFixed(1)}%\``, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/about/, (msg) => {
    bot.sendMessage(msg.chat.id, getAboutText(config.getCurrentYear(), config.getCurrentDateTime()), { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/ping/, async (msg) => {
    const chatId = msg.chat.id;
    const start = Date.now();
    const message = await bot.sendMessage(chatId, "🏓 *Pinging...*", { parse_mode: 'Markdown' });
    const latency = Date.now() - start;
    bot.editMessageText(`🏓 *PONG!*\n\n📡 Response Time: \`${latency}ms\`\n✅ Status: ONLINE`, { chat_id: chatId, message_id: message.message_id, parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, `*🆘 HELP & SUPPORT*\n\n📞 *WhatsApp:* ${config.WHATSAPP}\n✈️ *Telegram:* ${config.TELEGRAM}\n🐙 *GitHub:* ${config.GITHUB}\n📧 *Email:* ${config.EMAIL}\n\n*⚡ How to use:*\n1️⃣ Click VERIFY\n2️⃣ Click START BOMB\n3️⃣ Enter 11 digit number\n4️⃣ Enter SMS count (1-50)`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/status/, (msg) => {
    bot.sendMessage(msg.chat.id, getStatusText(config.getCurrentYear(), config.getCurrentDateTime(), APIS.length), { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

console.log('🤖 Bot is running...');

module.exports = bot;
