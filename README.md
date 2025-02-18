# Discord Bot

**This is a simple Discord bot that provides various administrative commands for server moderation.**

## Features

• Manage bot admins

• Kick, ban, mute, and unmute users

• Clear messages in bulk

• Display a list of bot commands

• Provide a link to claim the Discord Active Developer Badge

## Commands

|    **Command**    |                **Description**                      | **Permission Required** |
|---------------|-------------------------------------------------|---------------------|
| `$developer_badge` | Get the link to claim the Active Developer Badge. | None         |
| `$kick @user`  | Kick a mentioned user from the server.         | Kick Members        |
| `$ban @user`   | Ban a mentioned user from the server.          | Ban Members         |
| `$mute @user`  | Mute a mentioned user.                         | Manage Roles        |
| `$unmute @user` | Unmute a mentioned user.                      | Manage Roles        |
| `$clear <amount>` | Delete messages (1-100).                    | Manage Messages     |
| `$make_admin @user` | Grant admin permissions to a user.        | Bot Owner           |
| `$list_admins` | Display all bot admins.                        | None                |
| `$remove_admin @user` | Remove a user from the admin list.      | Bot Owner           |


## Installation

### Clone the repository:
```
git clone https://github.com/your-repo-name.git
```
### Navigate to the project directory:
```
cd your-repo-name
```
### Install dependencies:
```
npm install
```
### Set up your .env file and add your bot token:

``BOT_TOKEN=your-bot-token-here``

### Start the bot:
```
node bot.js
```
## Requirements

``Node.js``

``Discord.js``

## License

**This project is licensed under the MIT License.**

