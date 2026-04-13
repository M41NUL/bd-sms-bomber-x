const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const { userVerifications, userSessions, userStats } = require('./database');
const { getWelcomeMessage, getVerifiedMenu, getAboutText, getStatusText, formatNumber } = require('./utils');
const { handleBombing } = require('./bomber');
const { APIS } = require('./apis');

const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

let userMessages = new Map();

async function deleteMessage(chatId, messageId) {
    try {
        await bot.deleteMessage(chatId, messageId);
    } catch (error) {}
}

async function clearPreviousMessages(chatId, userId) {
    if (userMessages.has(userId)) {
        const messages = userMessages.get(userId);
        for (const msgId of messages) {
            await deleteMessage(chatId, msgId);
        }
    }
    userMessages.set(userId, []);
}

async function sendAndTrack(chatId, userId, text, options = {}) {
    await clearPreviousMessages(chatId, userId);
    const sent = await bot.sendMessage(chatId, text, options);
    const messages = userMessages.get(userId) || [];
    messages.push(sent.message_id);
    userMessages.set(userId, messages);
    return sent;
}

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

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";
    const currentYear = config.getCurrentYear();
    
    userSessions.delete(chatId);
    await clearPreviousMessages(chatId, userId);
    
    if (userId.toString() === config.ADMIN_ID) {
        await sendAndTrack(chatId, userId, `👑 *Welcome Admin ${firstName}!*\n\n🔥 You have direct access.\n💣 Use /bomb to start.`, { parse_mode: 'Markdown' });
        return;
    }
    
    const welcomeText = `*🌟 Welcome ${firstName}! 🌟*\n\n${getWelcomeMessage(firstName, currentYear)}`;
    await sendAndTrack(chatId, userId, welcomeText, { parse_mode: 'Markdown', ...welcomeKeyboard });
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const currentYear = config.getCurrentYear();
    
    await deleteMessage(chatId, query.message.message_id);
    
    if (data === "verify") {
        userVerifications.set(userId, {
            channel: true, group: true, youtube: true, verified: true, verifiedAt: Date.now()
        });
        
        await sendAndTrack(chatId, userId, `*✅ VERIFICATION SUCCESSFUL! ✅*\n\n${getVerifiedMenu(currentYear)}`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "start_bomb") {
        if (!isVerified(userId)) {
            await sendAndTrack(chatId, userId, "*❌ You are not verified!*\n\nPlease click VERIFY button first.", { parse_mode: 'Markdown' });
            return;
        }
        userSessions.set(chatId, { step: 'number' });
        await sendAndTrack(chatId, userId, "*💣 TARGET NUMBER*\n\n📋 Enter 11 digit number:\n\n⚡ Example: `013XXXXXXXX`", { parse_mode: 'Markdown', ...bombKeyboard });
    }
    
    else if (data === "my_stats") {
        const stats = userStats.get(userId) || { total: 0, success: 0, failed: 0 };
        const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        await sendAndTrack(chatId, userId, `*📈 YOUR STATISTICS*\n\n🔥 *Total Bombs:* \`${stats.total}\`\n✅ *Success:* \`${stats.success}\`\n❌ *Failed:* \`${stats.failed}\`\n📊 *Success Rate:* \`${rate.toFixed(1)}%\``, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "about") {
        await sendAndTrack(chatId, userId, getAboutText(config.getCurrentYear(), config.getCurrentDateTime()), { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "ping") {
        const start = Date.now();
        const latency = Date.now() - start;
        await sendAndTrack(chatId, userId, `🏓 *PONG!*\n\n📡 Response Time: \`${latency}ms\`\n✅ Status: ONLINE`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "help") {
        await sendAndTrack(chatId, userId, `*🆘 HELP & SUPPORT*\n\n📞 *WhatsApp:* ${config.WHATSAPP}\n✈️ *Telegram:* ${config.TELEGRAM}\n🐙 *GitHub:* ${config.GITHUB}\n📧 *Email:* ${config.EMAIL}\n\n*⚡ How to use:*\n1️⃣ Click VERIFY\n2️⃣ Click START BOMB\n3️⃣ Enter 11 digit number\n4️⃣ Enter SMS count (1-50)`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "status") {
        await sendAndTrack(chatId, userId, getStatusText(config.getCurrentYear(), config.getCurrentDateTime(), APIS.length), { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "cancel_bomb") {
        userSessions.delete(chatId);
        await sendAndTrack(chatId, userId, "*❌ Bombing cancelled!*", { parse_mode: 'Markdown', ...mainMenuKeyboard });
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
                await sendAndTrack(chatId, userId, "*🔢 SMS QUANTITY*\n\nMinimum: 1\nMaximum: 50\n\n📝 Enter amount:", { parse_mode: 'Markdown', ...bombKeyboard });
            } else {
                await sendAndTrack(chatId, userId, "*❌ Invalid number!* Please enter 11 digits.", { parse_mode: 'Markdown' });
            }
        }
        
        else if (session.step === 'count') {
            const count = parseInt(text);
            if (count >= 1 && count <= 50) {
                userSessions.delete(chatId);
                await handleBombing(bot, chatId, userId, session.number, count);
                await sendAndTrack(chatId, userId, "*💫 Want to bomb again?*\n\nClick START BOMB button!", { parse_mode: 'Markdown', ...mainMenuKeyboard });
            } else {
                await sendAndTrack(chatId, userId, "*❌ Invalid count!* Please enter 1-50.", { parse_mode: 'Markdown' });
            }
        }
    }
});

bot.onText(/\/bomb/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    await clearPreviousMessages(chatId, userId);
    
    if (!isVerified(userId)) {
        await sendAndTrack(chatId, userId, "*❌ You are not verified!*\n\nPlease click VERIFY button first.", { parse_mode: 'Markdown' });
        return;
    }
    
    userSessions.set(chatId, { step: 'number' });
    await sendAndTrack(chatId, userId, "*💣 TARGET NUMBER*\n\n📋 Enter 11 digit number:\n\n⚡ Example: `013XXXXXXXX`", { parse_mode: 'Markdown', ...bombKeyboard });
});

bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const stats = userStats.get(userId) || { total: 0, success: 0, failed: 0 };
    const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
    await sendAndTrack(chatId, userId, `*📈 YOUR STATISTICS*\n\n🔥 *Total Bombs:* \`${stats.total}\`\n✅ *Success:* \`${stats.success}\`\n❌ *Failed:* \`${stats.failed}\`\n📊 *Success Rate:* \`${rate.toFixed(1)}%\``, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/about/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    await sendAndTrack(chatId, userId, getAboutText(config.getCurrentYear(), config.getCurrentDateTime()), { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/ping/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const start = Date.now();
    const latency = Date.now() - start;
    await sendAndTrack(chatId, userId, `🏓 *PONG!*\n\n📡 Response Time: \`${latency}ms\`\n✅ Status: ONLINE`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    await sendAndTrack(chatId, userId, `*🆘 HELP & SUPPORT*\n\n📞 *WhatsApp:* ${config.WHATSAPP}\n✈️ *Telegram:* ${config.TELEGRAM}\n🐙 *GitHub:* ${config.GITHUB}\n📧 *Email:* ${config.EMAIL}\n\n*⚡ How to use:*\n1️⃣ Click VERIFY\n2️⃣ Click START BOMB\n3️⃣ Enter 11 digit number\n4️⃣ Enter SMS count (1-50)`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    await sendAndTrack(chatId, userId, getStatusText(config.getCurrentYear(), config.getCurrentDateTime(), APIS.length), { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

console.log('🤖 Bot is running...');

module.exports = bot;
