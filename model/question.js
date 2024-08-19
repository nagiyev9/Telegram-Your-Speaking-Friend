const sequelize = require('../database/db');
const { Sequelize, DataTypes, NOW } = require('sequelize');

const Question = sequelize.define('Question', {
    question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correct_answer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    wrong_answer1: {
        type: DataTypes.STRING,
        allowNull: false
    },
    wrong_answer2: {
        type: DataTypes.STRING,
        allowNull: false
    },
    wrong_answer3: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'questions',
    timestamps: false
});

module.exports = Question;