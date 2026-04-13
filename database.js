// In-memory database (for Railway, use this)
// For production with multiple instances, use Redis

const userVerifications = new Map(); // userId -> {channel, group, youtube, verified}
const userCooldowns = new Map(); // userId -> timestamp
const userStats = new Map(); // userId -> {total, success, failed}
const userSessions = new Map(); // userId -> {step, number, count}

module.exports = {
    userVerifications,
    userCooldowns,
    userStats,
    userSessions
};
