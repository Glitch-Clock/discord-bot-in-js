const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const keepAlive = require('./webservice');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const BOT_TOKEN = "YOUR_BOT_TOKEN"; // Replace with your actual bot token
const PREFIX = "$";

const botOwnerId = "YOUR_DISCORD_USER_ID"; // Replace with your Discord user ID
const approvedAdmins = new Set([botOwnerId]); // List of approved admins

const mutedUsers = new Map(); // Store muted users and their roles

// Bot Setup
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Command Handler
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Make Admin Command
    if (command === "make_admin") {
        if (!approvedAdmins.has(msg.author.id)) {
            return msg.reply("You don't have permission to use this command.");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("Please mention a user to make an admin.");
        }

        approvedAdmins.add(member.id);
        msg.reply(`${member.user.tag} has been granted bot admin permissions.`);
    }

    // Remove admin command
    if (command === "remove_admin") {
        if (msg.author.id !== BOT_OWNER_ID) {
            return msg.reply("❌ You are not authorized to remove admins!");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("⚠️ Please mention a user to remove from the admin list.");
        }

        if (!botAdmins.has(member.id)) {
            return msg.reply("⚠️ This user is not an admin.");
        }

        botAdmins.delete(member.id);
        msg.reply(`✅ **${member.user.tag}** has been removed from the admin list.`);
    }

    
    // List Admins Command
    if (command === "list_admins") {
        if (approvedAdmins.size === 1) { // Only the bot owner exists
            return msg.reply("📜 **Bot Admins List:**\n\n*No admins assigned yet.*");
        }

        let adminList = "";
        approvedAdmins.forEach(adminId => {
            const adminUser = msg.guild.members.cache.get(adminId);
            if (adminUser) {
                adminList += `🔹 **${adminUser.user.tag}** (<@${adminId}>)\n`;
            }
        });

        const embed = new EmbedBuilder()
            .setTitle("🛠️ **Bot Admins List**")
            .setDescription(adminList || "*No admins assigned yet.*")
            .setColor("#FFD700")
            .setFooter({ text: `Requested by ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
            .setTimestamp();

        return msg.reply({ embeds: [embed] });
    }


    // Help command
    if (command === "help") {
        const embed = new EmbedBuilder()
            .setTitle("📝 **Bot Commands**")
            .setDescription("Here is a list of all available commands:")
            .addFields(
                { name: "`$developer_badge`", value: "Get the link to claim your Discord Active Developer Badge." },
                { name: "`$kick @user`", value: "Kick a mentioned user from the server. (Requires Kick Members permission)" },
                { name: "`$ban @user`", value: "Ban a mentioned user from the server. (Requires Ban Members permission)" },
                { name: "`$mute @user`", value: "Mute a mentioned user. (Requires Manage Roles permission)" },
                { name: "`$unmute @user`", value: "Unmute a mentioned user. (Requires Manage Roles permission)" },
                { name: "`$clear <amount>`", value: "Delete a specified number of messages (1-100). (Requires Manage Messages permission)" },
                { name: "`$make_admin @user`", value: "Grant admin permissions to a specific user. (Only bot owner can use this)" },
                { name: "`$list_admins`", value: "Display all users with admin permissions." },
                { name: "`$remove_admin @user`", value: "Remove a user from the admin list, revoking bot permissions. (Only bot owner can use this)" }
            )
            .setColor("#00FF00") // Green color
            .setFooter({ text: `Requested by ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
            .setTimestamp();

        return msg.reply({ embeds: [embed] });
    }


    // Developer Badge Command (Anyone Can Use)
    if (command === "developer_badge") {
        msg.reply("https://discord.com/developers/active-developer");
    }

    // Restricted Commands (Only for Approved Admins)
    const restrictedCommands = ["kick", "ban", "mute", "unmute", "clear"];
    if (restrictedCommands.includes(command) && !approvedAdmins.has(msg.author.id)) {
        return msg.reply("You don't have permission to use this command.");
    }

    // Kick Command
    if (command === "kick") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Please mention a user to kick.");
        if (!member.kickable) return msg.reply("I cannot kick this user.");

        await member.kick();
        msg.reply(`${member.user.tag} has been kicked.`);
    }

    // Ban Command
    if (command === "ban") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Please mention a user to ban.");
        if (!member.bannable) return msg.reply("I cannot ban this user.");

        await member.ban();
        msg.reply(`${member.user.tag} has been banned.`);
    }

    // Mute Command
    if (command === "mute") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Please mention a user to mute.");

        const muteRole = msg.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) return msg.reply("Please create a role named 'Muted' to use this command.");

        mutedUsers.set(member.id, member.roles.cache.map(role => role.id));
        await member.roles.set([muteRole.id]);
        msg.reply(`${member.user.tag} has been muted.`);
    }

    // Unmute Command
    if (command === "unmute") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Please mention a user to unmute.");

        if (!mutedUsers.has(member.id)) return msg.reply("This user is not muted.");
        await member.roles.set(mutedUsers.get(member.id));
        mutedUsers.delete(member.id);

        msg.reply(`${member.user.tag} has been unmuted.`);
    }

    // Clear Command
    if (command === "clear") {
        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return msg.reply("Please provide a number between 1 and 100.");
        }

        await msg.channel.bulkDelete(amount + 1);
        msg.reply(`Deleted ${amount} messages.`).then(replyMsg => {
            setTimeout(() => replyMsg.delete(), 5000);
        });
    }
});

keepAlive();
client.login(BOT_TOKEN);
