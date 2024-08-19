const Question = require('../model/question');

// All Questions
exports.get_all_questions = async () => {
    return await Question.findAll();
};