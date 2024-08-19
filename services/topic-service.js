const Topic = require('../model/topic');
const sequelize = require('../database/db');

// Get One Random Topic
exports.get_one_topic = async () => {
    return await Topic.findOne({
        order: sequelize.random(),
        attributes: ['topic', 'first_verb', 'second_verb', 'third_verb', 'fourth_verb', 'fifth_verb', 'first_question', 'second_question', 'third_question', 'fourth_question', 'fifth_question']
    });
};