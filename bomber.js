const { sendSmsBomb, formatNumber } = require('./utils');
const config = require('./config');
const { userStats, userCooldowns } = require('./database');

async function handleBombing(bot, chatId, userId, number, count) {
    // Check cooldown
    const lastUsed = userCooldowns.get(userId) || 0;
    const now = Date.now();
    if (now - lastUsed < config.COOLDOWN_SECONDS * 1000) {
        const remaining = Math.ceil((config.COOLDOWN_SECONDS * 1000 - (now - lastUsed)) / 1000);
        bot.sendMessage(chatId, `⏰ *Please wait ${remaining} seconds before another bomb!*`, { parse_mode: 'Markdown' });
        return false;
    }
    
    // Update stats
    if (!userStats.has(userId)) {
        userStats.set(userId, { total: 0, success: 0, failed: 0 });
    }
    
    const statusMsg = await bot.sendMessage(chatId, `💣 *Bombing Started!*\n\n📱 Target: \`${formatNumber(number)}\`\n🔢 Count: \`${count}\` SMS\n\n⏳ Progress: 0%`, { parse_mode: 'Markdown' });
    
    const { success, failed } = await sendSmsBomb(number, count, async (current, total, succ, fail) => {
        const percent = Math.floor((current / total) * 100);
        try {
            await bot.editMessageText(
                `💣 *Bombing in Progress...*\n\n📱 Target: \`${formatNumber(number)}\`\n✅ Success: \`${succ}\`\n❌ Failed: \`${fail}\`\n📊 Progress: \`${percent}%\``,
                { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }
            );
        } catch (e) {}
    });
    
    // Update user stats
    const stats = userStats.get(userId);
    stats.total += count;
    stats.success += success;
    stats.failed += failed;
    userStats.set(userId, stats);
    
    // Set cooldown
    userCooldowns.set(userId, now);
    
    const rate = (success / (success + failed)) * 100;
    const resultText = `
*✅ BOMBING COMPLETE!* ✅

📱 *Target:* \`${formatNumber(number)}\`
✅ *Success:* \`${success}/${count}\`
❌ *Failed:* \`${failed}/${count}\`
📊 *Rate:* \`${rate.toFixed(1)}%\`

━━━━━━━━━━━━━━━━━━━━━
*🔥 Thanks for using BD SMS MASTER!*
━━━━━━━━━━━━━━━━━━━━━

💫 *Send /bomb to start new attack*
    `;
    
    await bot.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });
    return true;
}

module.exports = { handleBombing };
