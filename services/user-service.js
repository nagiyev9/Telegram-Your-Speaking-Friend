const User = require('../model/user');
const { Sequelize, Op } = require('sequelize');

// Get One User By ID
exports.get_one_user_by_id = async (chat_id) => {
    return await User.findOne({ 
        where: { chat_id: chat_id.toString() } 
    });
};

// Get One User By Username
exports.get_one_user_by_username = async (username) => {
    return await User.findOne({ 
        where: { username: username }
    });
};

// Find Banned User After 1 Month
exports.ban_user_after_month = async () => {
    User.findAll({
        where: {
            banned: false,
            last_unban_date: {
                [Sequelize.Op.lt]: Sequelize.literal('NOW() - INTERVAL \'1 month\'')
            }
        }
    });
};

// Create New User 
exports.add_new_user = async (username, password, chat_id) => {
    return await User.create({
        username: username,
        password: password,
        chat_id: chat_id,
        last_unban_date: new Date()
    });
};

// Update User English Level
exports.update_user_english_level = async (chat_id, english_level) => {
    return await User.update({ english_level: english_level }, { where: { chat_id: chat_id } });
};

