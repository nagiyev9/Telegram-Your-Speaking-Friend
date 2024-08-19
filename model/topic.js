const sequelize = require('../database/db');
const { Sequelize, DataTypes, NOW } = require('sequelize');

const Topic = sequelize.define('Topic', {
    topic: {
        type: DataTypes.STRING,
        allowNull: false
    },
    first_question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    second_question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    third_question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fourth_question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fifth_question: {
        type: DataTypes.STRING,
        allowNull: false
    },
    first_verb: {
        type: DataTypes.STRING,
        allowNull: false
    },
    second_verb: {
        type: DataTypes.STRING,
        allowNull: false
    },
    third_verb: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fourth_verb: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fifth_verb: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    tableName: 'topics',
    timestamps: false
});

module.exports = Topic;