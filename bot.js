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
    return verified && verified.channel && verified.group && verified.youtube;
}

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";
    const currentYear = config.getCurrentYear();
    
    userSessions.delete(chatId);
    
    if (userId.toString() === config.ADMIN_ID) {
        bot.sendMessage(chatId, `👑 *Welcome Admin ${firstName}!*\n\n🔥 You have direct access to all features.\n💣 Use /bomb to start.`, { parse_mode: 'Markdown' });
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
    
    if (userId.toString() === config.ADMIN_ID) {
        if (data === "start_bomb") {
            userSessions.set(chatId, { step: 'number' });
            bot.sendMessage(chatId, "*💣 TARGET NUMBER*\n\n📋 Enter 11 digit number:\n\n⚡ Example: `013XXXXXXXX`", { parse_mode: 'Markdown', ...bombKeyboard });
        }
        return;
    }
    
    if (data === "verify") {
        const checkingMsg = await bot.sendMessage(chatId, "🔍 *Checking verification status...*", { parse_mode: 'Markdown' });
        
        let isChannelMember = false;
        let isGroupMember = false;
        
        try {
            const chatMemberChannel = await bot.getChatMember(config.TELEGRAM_CHANNEL.replace('https://t.me/', '@'), userId);
            isChannelMember = ['member', 'administrator', 'creator'].includes(chatMemberChannel.status);
        } catch (error) {}
        
        try {
            const chatMemberGroup = await bot.getChatMember(config.TELEGRAM_GROUP.replace('https://t.me/', '@'), userId);
            isGroupMember = ['member', 'administrator', 'creator'].includes(chatMemberGroup.status);
        } catch (error) {}
        
        const isYoutubeSubscribed = true;
        
        if (isChannelMember && isGroupMember && isYoutubeSubscribed) {
            userVerifications.set(userId, {
                channel: true, group: true, youtube: true, verified: true, verifiedAt: Date.now()
            });
            
            await bot.editMessageText(`*✅ VERIFICATION SUCCESSFUL! ✅*\n\n${getVerifiedMenu(currentYear)}`, 
                { chat_id: chatId, message_id: checkingMsg.message_id, parse_mode: 'Markdown', ...mainMenuKeyboard });
        } else {
            let failMessage = "*❌ VERIFICATION FAILED!* ❌\n\n*Please complete all requirements:*\n\n";
            if (!isChannelMember) failMessage += "❌ *Join Telegram Channel*\n";
            if (!isGroupMember) failMessage += "❌ *Join Telegram Group*\n";
            if (!isYoutubeSubscribed) failMessage += "❌ *Subscribe on YouTube*\n";
            failMessage += "\n*After joining, click VERIFY again!*";
            
            await bot.editMessageText(failMessage, 
                { chat_id: chatId, message_id: checkingMsg.message_id, parse_mode: 'Markdown', ...welcomeKeyboard });
        }
    }
    
    else if (data === "start_bomb") {
        if (!isVerified(userId)) {
            bot.sendMessage(chatId, "*❌ You are not verified!*\n\nPlease complete verification first using /start", { parse_mode: 'Markdown' });
            return;
        }
        userSessions.set(chatId, { step: 'number' });
        bot.sendMessage(chatId, "*💣 TARGET NUMBER*\n\n📋 Enter 11 digit number:\n\n⚡ Example: `013XXXXXXXX`", { parse_mode: 'Markdown', ...bombKeyboard });
    }
    
    else if (data === "my_stats") {
        const stats = userStats.get(userId) || { total: 0, success: 0, failed: 0 };
        const rate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
        bot.sendMessage(chatId, `*📈 YOUR STATISTICS*\n\n🔥 *Total Bombs:* \`${stats.total}\`\n✅ *Success:* \`${stats.success}\`\n❌ *Failed:* \`${stats.failed}\`\n📊 *Success Rate:* \`${rate.toFixed(1)}%\``, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "about") {
        bot.sendMessage(chatId, getAboutText(config.getCurrentYear(), config.getCurrentDateTime()), { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "ping") {
        const start = Date.now();
        const msg = await bot.sendMessage(chatId, "🏓 *Pinging...*", { parse_mode: 'Markdown' });
        const latency = Date.now() - start;
        bot.editMessageText(`🏓 *PONG!*\n\n📡 Response Time: \`${latency}ms\`\n✅ Status: ONLINE`, { chat_id: chatId, message_id: msg.message_id, parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "help") {
        bot.sendMessage(chatId, `*🆘 HELP & SUPPORT*\n\n📞 *WhatsApp:* ${config.WHATSAPP}\n✈️ *Telegram:* ${config.TELEGRAM}\n🐙 *GitHub:* ${config.GITHUB}\n📧 *Email:* ${config.EMAIL}\n\n*⚡ How to use:*\n1️⃣ Send /bomb\n2️⃣ Enter target number (11 digits)\n3️⃣ Enter SMS count (1-50)\n4️⃣ Wait for results`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "status") {
        bot.sendMessage(chatId, getStatusText(config.getCurrentYear(), config.getCurrentDateTime(), APIS.length), { parse_mode: 'Markdown', ...mainMenuKeyboard });
    }
    
    else if (data === "cancel_bomb") {
        userSessions.delete(chatId);
        bot.sendMessage(chatId, "*❌ Bombing cancelled!*\n\nUse /start to return to main menu", { parse_mode: 'Markdown' });
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
                bot.sendMessage(chatId, "*💫 Want to bomb again?*\n\nClick START BOMB button below!", { parse_mode: 'Markdown', ...mainMenuKeyboard });
            } else {
                bot.sendMessage(chatId, "*❌ Invalid count!* Please enter a number between 1-50.", { parse_mode: 'Markdown' });
            }
        }
    }
});

bot.onText(/\/bomb/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!isVerified(userId)) {
        bot.sendMessage(chatId, "*❌ You are not verified!*\n\nPlease complete verification first using /start", { parse_mode: 'Markdown' });
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
    bot.sendMessage(msg.chat.id, `*🆘 HELP & SUPPORT*\n\n📞 *WhatsApp:* ${config.WHATSAPP}\n✈️ *Telegram:* ${config.TELEGRAM}\n🐙 *GitHub:* ${config.GITHUB}\n📧 *Email:* ${config.EMAIL}\n\n*⚡ How to use:*\n1️⃣ Send /bomb\n2️⃣ Enter target number (11 digits)\n3️⃣ Enter SMS count (1-50)\n4️⃣ Wait for results`, { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

bot.onText(/\/status/, (msg) => {
    bot.sendMessage(msg.chat.id, getStatusText(config.getCurrentYear(), config.getCurrentDateTime(), APIS.length), { parse_mode: 'Markdown', ...mainMenuKeyboard });
});

console.log('🤖 Bot is running on Railway...');

module.exports = bot;
