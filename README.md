*Your Speaking Friend - Telegram Bot*

Overview

Your Speaking Friend is a Node.js-based Telegram bot designed to help users improve their English skills while connecting with new friends. The bot provides conversation topics, questions, and phrasal verbs to users who are matched with each other. It also includes various administrative features for user management.

- Features
    - User Registration: Users must register an account before starting.
    - Password Hashing: User passwords are securely hashed in the database.
    - Chat Matching: Connect with other users to practice English.
    - Topics and Questions: Receive a topic with 5 questions and 5 phrasal verbs for discussion.
    - Admin Features:
        - Ban and unban users.
        - Refresh user accounts duration.
        - Accounts are automatically banned after 1 month due to payment.

- Available Commands
    - /start - Start the bot.
    - /end - End the current process.
    - /test - Test your English level.
    - /myid - Check your chat ID.
    - /help - Get help and instructions.

- Setup
   - 1. Install Dependencies
       - Make sure you have Node.js installed. Run the following command to install the required packages:

              npm install

   - 2. Setup Environment Variables
        - Create a .env file in the root directory of your project and add the following environment variables:
       
              TELEGRAM_TOKEN=your_bot_telegram_token
              DB_PORT=your_database_port
              DB_HOST=your_database_host
              DB_USER=your_database_user
              DB_NAME=your_database_name
              DB_PASSWORD=your_database_password
              ADMIN=your_admin_user_chat_id

          Replace the placeholders with your actual values.

    - 3. Start the Bot
         - To start the bot, run:

               npm start

*License*
This project is licensed under the "No License" license. This means that the source code is provided "as is", without any permission for use, distribution, or modification. You are not allowed to use, copy, modify, or distribute the code in any form.
