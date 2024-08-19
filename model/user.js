const sequelize = require('../database/db');
const { Sequelize, DataTypes, NOW } = require('sequelize');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    chat_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    banned: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    last_unban_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW 
    },
    english_level: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'unknown' 
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;