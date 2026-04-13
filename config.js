// ============================================
// DEVELOPER INFORMATION 
// ============================================

const dotenv = require('dotenv');
dotenv.config();

// Auto-updating date and year
const getCurrentYear = () => new Date().getFullYear();
const getCurrentDateTime = () => new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });

module.exports = {
    // Bot Config
    BOT_TOKEN: process.env.BOT_TOKEN,
    PORT: process.env.PORT || 8080,
    ADMIN_ID: process.env.ADMIN_ID,
    IS_RAILWAY: process.env.RAILWAY === 'true',
    
    // Developer Info (Auto-updating)
    AUTHOR: "Md. Mainul Islam",
    OWNER: "MAINUL - X",
    GITHUB: "M41NUL",
    GITHUB_URL: "https://github.com/M41NUL",
    WHATSAPP: "+8801308850528",
    TELEGRAM: "t.me/mdmainulislaminfo",
    TELEGRAM_CHANNEL: "https://t.me/mainul_x_official",
    TELEGRAM_GROUP: "https://t.me/mainul_x_official_gc",
    EMAIL: "githubmainul@gmail.com",
    YOUTUBE: "https://youtube.com/@mdmainulislaminfo",
    LICENSE: "MIT License",
    
    // Auto-updating functions
    getCurrentYear,
    getCurrentDateTime,
    
    // Limits
    MAX_SMS_PER_BOMB: 50,
    MIN_SMS_PER_BOMB: 1,
    COOLDOWN_SECONDS: 30,
    
    // API Timeout
    API_TIMEOUT: 5000
};
