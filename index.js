const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const userService = require('./services/user-service');
const topicService = require('./services/topic-service');
const questionService = require('./services/question-service');

dotenv.config();

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

const userTests = {};
let waitingUsers = [];
let userPairs = {};

const validCommands = ['/start', '/end', '/test', '/myid', '/help', '/chat', '/register', '/ban', '/unban', '/refreshtime'];

const isAdmin = (chatId) => {
    const adminChatIds = [process.env.ADMIN];
    return adminChatIds.includes(chatId);
};

const sendStartMessage = (chatId) => {
    const helperCommand = `<b>Welcome to 'Your Speaking Friend'! I'm here to help you practice and improve your English conversation skills. Whether you're a beginner or advanced, you can speak with different people in your level. I'll help you enhance your vocabulary, grammar, and fluency. Let's embark on this journey to better English together.</b>\n
<b>/register username password</b> - <i>Create a new account</i>\n
<b>/chat username password</b> - <i>Start a new chat</i>\n
<b>/start</b> - <i>Start bot</i>\n
<b>/end</b> - <i>End chat or queue</i>\n
<b>/test</b> - <i>Start an English test</i>\n
<b>/myid</b> - <i>Your chat id</i>\n
<b>/help</b> - <i>Command list</i>`;

    const photoPath = 'C:/Users/mehed/OneDrive/Masaüstü/Telegram Bot/Telegram/public/img/2.jpg';

    bot.sendPhoto(chatId, fs.createReadStream(photoPath), {
        caption: helperCommand,
        parse_mode: 'HTML',
        contentType: 'image/jpeg' // Explicitly specify the content type
    }).then(() => {
        console.log('Start message sent successfully');
    }).catch((error) => {
        console.error('Error sending photo:', error);
    });
};

const sendHelpMessage = (chatId) => {
    const helperCommand = `<b>!COMMAND LIST!</b>\n
<b>/register username password</b> - <i>Create a new account</i>\n
<b>/chat username password</b> - <i>Start a new chat</i>\n
<b>/start</b> - <i>Start bot</i>\n
<b>/end</b> - <i>End chat or queue</i>\n
<b>/test</b> - <i>Start an English test</i>\n
<b>/myid</b> - <i>Your chat id</i>\n
<b>/help</b> - <i>Command list</i>`;

    bot.sendMessage(chatId, helperCommand, { parse_mode: 'HTML' });
};

const sendQuestion = async (chatId) => {
    const userTest = userTests[chatId];
    const currentQuestion = userTest.currentQuestion;
    const question = userTest.questions[currentQuestion];

    if (userTest.askedQuestions.has(question.id)) {
        userTest.currentQuestion++;
        await sendQuestion(chatId);
        return;
    }

    userTest.askedQuestions.add(question.id);

    const options = [
        question.correct_answer,
        question.wrong_answer1,
        question.wrong_answer2,
        question.wrong_answer3,
    ];

    shuffleArray(options);
    const inlineKeyboard = options.map(option => ([{
        text: option,
        callback_data: JSON.stringify({ answer: option })
    }]));

    const sentMessage = await bot.sendMessage(chatId, `<i>${question.question}</i>`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: inlineKeyboard
        }
    });

    userTest.messageId = sentMessage.message_id;
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const calculateEnglishLevel = (score, totalQuestions) => {
    let englishLevel;
    if (score < totalQuestions * 0.2) {
        englishLevel = 'A1';
    } else if (score < totalQuestions * 0.4) {
        englishLevel = 'A2';
    } else if (score < totalQuestions * 0.6) {
        englishLevel = 'B1';
    } else if (score < totalQuestions * 0.8) {
        englishLevel = 'B2';
    } else if (score < totalQuestions * 0.9) {
        englishLevel = 'C1';
    } else {
        englishLevel = 'C2';
    }
    return englishLevel;
};

const handleTestCompletion = async (chatId, totalQuestions, score) => {
    const englishLevel = calculateEnglishLevel(score, totalQuestions);

    try {
        await userService.update_user_english_level(chatId, englishLevel);
        bot.sendMessage(chatId, `Test finished! Your score is ${score}/${totalQuestions}. Your English level is ${englishLevel}.`);
    } catch (error) {
        console.error('Error updating user English level in database:', error);
        bot.sendMessage(chatId, 'An error occurred while saving your English level.');
    }

    delete userTests[chatId];
};

const paymantMessage = () => {
    return `<b>Your account has been banned due to overdue payment.</b>\n
<b>Please contact this Instagram account</b>\n
<a href="https://www.instagram.com/your.speaking.friend/"><b>Your Speaking Friend</b></a>`;
};

const needTestMessage = () => {
    return `<b>Your level has not been determined</b>\n
<b>Please write /test and test yourself</b>`;
};

const getRandomTopic = async () => {
    try {
        const topic = await topicService.get_one_topic();
        if (topic) {
            return topic;
        } else {
            throw new Error('No topics available in the database');
        }
    } catch (error) {
        console.error('Error fetching random topic from database', error);
        throw error;
    }
};

const topicMessage = (topicData) => {
    const { topic, first_verb, second_verb, third_verb, fourth_verb, fifth_verb, first_question, second_question, third_question, fourth_question, fifth_question } = topicData;
    return `<b>Topic:</b> ${topic}\n
<b>1.</b> ${first_question}\n
<b>2.</b> ${second_question}\n
<b>3.</b> ${third_question}\n
<b>4.</b> ${fourth_question}\n
<b>5.</b> ${fifth_question}\n
<b>Phrasal Verbs:</b>\n
<b>1.</b> ${first_verb}\n
<b>2.</b> ${second_verb}\n
<b>3.</b> ${third_verb}\n
<b>4.</b> ${fourth_verb}\n
<b>5.</b> ${fifth_verb}`;
};

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text.startsWith('/')) {
        if (!validCommands.includes(text.split(' ')[0])) {
            bot.sendMessage(chatId, 'Invalid command. Please use /help to see the list of available commands.');
        }
        return;
    }

    if (userPairs[chatId]) {
        const partnerId = userPairs[chatId];
        bot.sendMessage(partnerId, text, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Option 1', callback_data: '1' }],
                    [{ text: 'Option 2', callback_data: '2' }]
                ]
            }
        }).then(() => {
            // Handle success or add logging
        }).catch((error) => {
            console.error('Error sending message:', error);
        });
    } else {
        bot.sendMessage(chatId, 'You are not connected with another user yet. Please wait.');
    }
});

bot.onText(/\/test/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        const allQuestions = await questionService.get_all_questions();
        if (allQuestions.length > 0) {
            shuffleArray(allQuestions);

            const selectedQuestions = allQuestions.slice(0, 25);

            userTests[chatId] = {
                currentQuestion: 0,
                score: 0,
                questions: selectedQuestions,
                askedQuestions: new Set(),
                answers: {}
            };

            await sendQuestion(chatId);
        } else {
            bot.sendMessage(chatId, "No questions available in the database.");
        }
    } catch (error) {
        console.error('Error fetching questions from database', error);
        bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userTest = userTests[chatId];

    if (userTest) {
        const currentQuestion = userTest.currentQuestion;
        const question = userTest.questions[currentQuestion];

        if (userTest.answers[currentQuestion] !== undefined) {
            bot.answerCallbackQuery(query.id, { text: 'You have already answered this question.' });
            return;
        }

        const selectedAnswer = JSON.parse(query.data).answer;
        userTest.answers[currentQuestion] = selectedAnswer;

        const updatedText = `<i>${question.question} (Answered)</i>`;

        bot.editMessageText(updatedText, {
            chat_id: chatId,
            message_id: query.message.message_id
        });

        if (selectedAnswer === question.correct_answer) {
            userTest.score++;
        }

        userTest.currentQuestion++;

        if (userTest.currentQuestion >= userTest.questions.length) {
            await handleTestCompletion(chatId, userTest.questions.length, userTest.score);
        } else {
            await sendQuestion(chatId);
        }
    }
});

bot.onText(/\/register (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];
    const password = match[2];

    try {
        const existingUser = await userService.get_one_user_by_id(chatId);

        if (existingUser) {
            bot.sendMessage(chatId, 'You already have an account. You cannot register again.');
        } else {
            // Check if the username is already taken
            const existingUsername = await userService.get_one_user_by_username(username);

            if (existingUsername) {
                const chatId = user.chat_id;
                bot.sendMessage(chatId, 'Username already taken. Please choose a different username.');
            } else {
                // Hash the password and create the new user
                const hashedPassword = await bcrypt.hash(password, 10);
                await userService.add_new_user(username, hashedPassword,chatId);

                bot.sendMessage(chatId, 'Registration successful. You can now use /chat <username> <password> to log in.');
            }
        }
    } catch (err) {
        console.error('Error querying the database', err);
        bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

bot.onText(/\/chat (\S+) (\S+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];
    const password = match[2];

    try {
        const user = await userService.get_one_user_by_username(username);

        if (user) {
            if (user.banned) {
                bot.sendMessage(chatId, paymantMessage(), { parse_mode: 'HTML' });
                return;
            }

            if (user.english_level === 'unknown') {
                bot.sendMessage(chatId, needTestMessage(), { parse_mode: 'HTML' });
                return;
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                bot.sendMessage(chatId, 'Login successful. You are in the queue, waiting for a match...');

                waitingUsers.push({
                    chatId: user.chat_id,
                    username: msg.from.username,
                    english_level: user.english_level
                });

                const compatibleLevels = {
                    'A1': ['A1', 'A2'],
                    'A2': ['A1', 'A2', 'B1'],
                    'B1': ['A2', 'B1', 'B2'],
                    'B2': ['B1', 'B2', 'C1'],
                    'C1': ['B2', 'C1', 'C2'],
                    'C2': ['C1', 'C2']
                };

                const matchIndex = waitingUsers.findIndex(waitingUser => 
                    compatibleLevels[user.english_level].includes(waitingUser.english_level) && 
                    waitingUser.chatId !== user.chat_id
                );

                if (matchIndex !== -1) {
                    const matchedUser = waitingUsers.splice(matchIndex, 1)[0];

                    userPairs[user.chat_id] = matchedUser.chatId;
                    userPairs[matchedUser.chatId] = user.chat_id;

                    try {
                        const topicData = await getRandomTopic();
                        const topicMessageText = topicMessage(topicData);

                        bot.sendMessage(user.chat_id, topicMessageText, { parse_mode: 'HTML' });
                        bot.sendMessage(matchedUser.chatId, topicMessageText, { parse_mode: 'HTML' });

                        bot.sendMessage(user.chat_id, `You are now connected with ${matchedUser.username ? `@${matchedUser.username}` : 'an anonymous user'}. Start chatting!`);
                        bot.sendMessage(matchedUser.chatId, `You are now connected with ${user.username ? `@${user.username}` : 'an anonymous user'}. Start chatting!`);
                    } catch (error) {
                        console.error('Error fetching topic', error);
                        bot.sendMessage(user.chat_id, 'An error occurred while fetching the topic. Please try again later.');
                        bot.sendMessage(matchedUser.chatId, 'An error occurred while fetching the topic. Please try again later.');
                    }
                } else {
                    bot.sendMessage(chatId, 'No compatible users found. You will be notified when a match is found.');
                }
            } else {
                bot.sendMessage(chatId, 'Invalid password. Please try again.');
            }
        } else {
            bot.sendMessage(chatId, 'You are not registered. Please use /register <username> <password> to create an account.');
        }
    } catch (err) {
        console.error('Error processing /chat command', err);
        bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

bot.onText(/\/myid/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Your chat ID is ${chatId}`);
});

bot.onText(/\/end/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Ending current session...');
});

bot.onText(/\/ban (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];

    if (!isAdmin(chatId)) {
        bot.sendMessage(chatId, 'You do not have permission to use this command.');
        return;
    }

    try {
        const user = await userService.get_one_user_by_username(username);

        if (user) {
            const chatId = user.chat_id;
            await user.update({ banned: true });
            bot.sendMessage(chatId, `User ${username} has been banned.`);
        } else {
            bot.sendMessage(chatId, `User ${username} does not exist.`);
        }
    } catch (err) {
        console.error('Error updating the database', err);
        bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

bot.onText(/\/unban (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];

    if (!isAdmin(chatId)) {
        bot.sendMessage(chatId, 'You do not have permission to use this command.');
        return;
    }

    try {
        const user = await userService.get_one_user_by_username(username);

        if (user) {
            const chatId = user.chat_id;
            await user.update({
                banned: false,
                last_unban_date: new Date() 
            });
            bot.sendMessage(chatId, `User ${username} has been unbanned.`);
        } else {
            bot.sendMessage(chatId, `User ${username} does not exist.`);
        }
    } catch (err) {
        console.error('Error updating the database', err);
        bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

bot.onText(/\/refreshtime (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];

    if (!isAdmin(chatId)) {
        return bot.sendMessage(chatId, 'You do not have permission to use this command!');
    }

    try {
        const user = await userService.get_one_user_by_username(username);

        if (user) {
            const chatId = user.chat_id;
            await user.update({ last_unban_date: new Date() }); 
            bot.sendMessage(chatId, `User ${username}'s time updated`);
        } else {
            bot.sendMessage(chatId, `User ${username} does not exist`);
        }
    } catch (err) {
        console.error('Error updating the database', err);
        bot.sendMessage(chatId, 'An error occurred. Please try again later.');
    }
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    sendHelpMessage(chatId);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sendStartMessage(chatId);
});

bot.setMyCommands([
    { command: '/start', description: 'Start the bot' },
    { command: '/end', description: 'End process' },
    { command: '/test', description: 'Test your level' },
    { command: '/myid', description: 'Check your chat ID' },
    { command: '/help', description: 'Get help' }
]);

const checkAutoBan = async () => {
    console.log('Running auto-ban check...');

    try {
        const usersToBan = await userService.ban_user_after_month();

        console.log('Users found:', usersToBan);
        for (const user of usersToBan) {
            user.banned = true;
            await user.save();

            const chatId = user.chat_id;
            bot.sendMessage(chatId, paymantMessage(), { parse_mode: 'HTML' });
            console.log(`User ${user.id} (${chatId}) banned.`);
        }
    } catch (err) {
        console.error('Error checking auto-ban', err);
    }
};

// Set interval to run checkAutoBan an every hour
setInterval(checkAutoBan, 1 * 60 * 60 * 1000);


bot.on('polling_error', (error) => console.log(error));
console.log('Bot is running...');




// const init = async () => {
//     sequelize.authenticate();
//     sequelize.sync( { alter: true } );
// }

// init()