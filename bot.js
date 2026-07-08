require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = "-1003924350648";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let running = false;
let timer = null;
let userLastUsed = {};
let messageCount = 0;

// Generate Random User ID
function generateRandomUserId() {
  const now = Date.now();

  let repeatUsers = Object.keys(userLastUsed).filter(uid => {
    let diff = (now - userLastUsed[uid]) / 1000;
    return diff >= 300 && diff <= 600;
  });

  if (repeatUsers.length && Math.random() <= 0.4) {
    let uid = repeatUsers[Math.floor(Math.random() * repeatUsers.length)];
    userLastUsed[uid] = now;
    return uid;
  }

  while (true) {
    let uid = `${Math.floor(Math.random() * 4000 + 6000)}****${Math.floor(Math.random() * 9000 + 1000)}`;
    if (!userLastUsed[uid]) {
      userLastUsed[uid] = now;
      return uid;
    }
  }
}

// ✅ Build Message - BOLD FORMAT (Sab Bold)
function buildMessage(userId, amount, runTime, trackTime) {
  return (
`*Conversation Count 💝*

*🎁 Offer Name - PolicyBazar*

*User Id :* ${userId}
*User Amount :* ₹${amount}
*🥳 User Payment :* Success

*Run Time -* ${runTime}
*Track Time -* ${trackTime}

*Powered By - CashFlix*`
  );
}

// Send Message Function with Markdown
async function sendMessageToChannel(userId, amount, runTime, trackTime) {
  try {
    await bot.sendMessage(
      CHANNEL_ID,
      buildMessage(userId, amount, runTime, trackTime),
      { parse_mode: "Markdown" }
    );
    messageCount++;
    console.log(`✅ ₹${amount} message sent for ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return false;
  }
}

// 🔥 Second Message - Random Time (1-2 Minute Ke Beech)
async function sendSecondMessage(userId, runTime) {
  // Random time between 60 to 120 seconds (1 to 2 minutes)
  const randomDelay = Math.floor(Math.random() * 60000) + 60000; // 60,000ms to 120,000ms
  // Ya simple: 60 se 120 seconds
  // const randomDelay = Math.floor(Math.random() * 60 + 60) * 1000;
  
  console.log(`⏳ Second message for ${userId} will send in ${Math.round(randomDelay/1000)} seconds`);

  setTimeout(async () => {
    if (!running) return;
    
    try {
      let now = new Date();
      let trackTime = now.toLocaleString();

      await bot.sendMessage(
        CHANNEL_ID,
        buildMessage(userId, "5", runTime, trackTime),
        { parse_mode: "Markdown" }
      );
      messageCount++;
      console.log(`✅ ₹5 (Second) message sent for ${userId} after ${Math.round(randomDelay/1000)} seconds`);
    } catch (error) {
      console.error(`❌ Second message error:`, error.message);
    }
  }, randomDelay);
}

// 🔥 MAIN FUNCTION - Har 1 Minute Mein 3 Messages (0.1)
async function startConversation() {
  console.log("🚀 Started - 3 messages per minute (₹0.1) + Random second messages (₹5)");

  timer = setInterval(async () => {
    if (!running) {
      clearInterval(timer);
      timer = null;
      return;
    }

    console.log(`⏰ Running at ${new Date().toLocaleTimeString()}`);

    // ===== 3 Messages with ₹0.1 =====
    for (let i = 0; i < 3; i++) {
      try {
        let now = new Date();
        let userId = generateRandomUserId();
        let runTime = new Date(now.getTime() - 60000).toLocaleString();
        let trackTime = now.toLocaleString();

        // Send 0.1 message
        await sendMessageToChannel(userId, "0.1", runTime, trackTime);
        
        // 🔥 Schedule second message (₹5) with random delay (1-2 minutes)
        sendSecondMessage(userId, runTime);
        
        // 1 second gap
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error("❌ Error:", error.message);
      }
    }

    console.log(`✅ 3 messages (₹0.1) sent this minute. Second messages (₹5) will come randomly in 1-2 minutes`);

  }, 60000); // 🔥 Har 1 Minute
}

// ===== COMMANDS =====

bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (running) {
    return bot.sendMessage(chatId, "⚠️ Already running!");
  }

  try {
    const botInfo = await bot.getMe();
    await bot.getChatMember(CHANNEL_ID, botInfo.id);
  } catch (error) {
    return bot.sendMessage(chatId, "❌ Bot is not admin in channel!");
  }

  running = true;
  messageCount = 0;
  startConversation();
  bot.sendMessage(chatId, "✅ Started! 3x ₹0.1 per minute + Random ₹5 messages (1-2 min delay)");
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  
  bot.sendMessage(chatId, `🛑 Stopped. Total: ${messageCount}`);
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `
📊 Status:
Running: ${running ? "✅ Yes" : "❌ No"}
Total Messages: ${messageCount}
Speed: 3x ₹0.1/min + Random ₹5 (1-2 min delay)
  `);
});

console.log("🤖 Bot Started...");
console.log("📢 3x ₹0.1 per minute + Random ₹5 messages (1-2 min delay)");
