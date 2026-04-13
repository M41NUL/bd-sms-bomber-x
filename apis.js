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
    { name: "Chaldal", url: "https://chaldal.com/yolk/api-v4/Auth/RequestOtpVerificationWithApiKey", method: "POST", type: "params", params: (n) => ({ phoneNumber: `0${n}` }) },
    { name: "Foodpanda", url: "https://www.foodpanda.com.bd/account/request-otp", method: "POST", type: "json", data: (n) => ({ phone: `+880${n}`, country: "BD" }) },
    { name: "Pathao", url: "https://api.pathao.com/api/v2/auth/otp", method: "POST", type: "json", data: (n) => ({ phone: `0${n}` }) },
    { name: "Daraz", url: "https://member.daraz.com.bd/user/send-otp", method: "POST", type: "json", data: (n) => ({ mobile: `0${n}`, countryCode: "BD" }) },
    { name: "Rokomari", url: "https://www.rokomari.com/otp/send", method: "GET", type: "params", data: (n) => ({ emailOrPhone: `880${n}`, countryCode: "BD" }) },
    { name: "ShopUp", url: "https://api.shopup.com.bd/v1/auth/otp/send", method: "POST", type: "json", data: (n) => ({ phone: `+880${n}` }) },
    { name: "Priyoshop", url: "https://www.priyoshop.com/api/login", method: "POST", type: "json", data: (n) => ({ mobile: `0${n}` }) },
    { name: "Ajkerdeal", url: "https://ajkerdeal.com/api/v1/otp/send", method: "POST", type: "json", data: (n) => ({ mobile: `0${n}` }) },
    { name: "Othoba", url: "https://othoba.com/ShoppingCart/SendVerificationCode", method: "POST", type: "form", data: (n) => ({ phoneNumber: `0${n}` }) }
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

module.exports = { APIS, getRandomUserAgent };
