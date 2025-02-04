const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const BOT_TOKEN = "YOUR_BOT_TOKEN"; // Your bot token
const PREFIX = "$";


const mutedUsers = new Map(); // Store muted users and their roles


// Bot Setup
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return; // Ignore messages from other bots
    if (!msg.content.startsWith(PREFIX)) return; // Only process commands with the prefix

    const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Check for discord developer badge
    if (command === "developer_badge") {
        msg.reply("https://discord.com/developers/active-developer");
    }
    
    // Kick command
    if (command === "kick") {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return msg.reply("You don't have permission to kick members.");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("Please mention a user to kick.");
        }

        if (!member.kickable) {
            return msg.reply("I cannot kick this user.");
        }

        await member.kick();
        msg.reply(`${member.user.tag} has been kicked.`);
    }

    // Ban command
    if (command === "ban") {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return msg.reply("You don't have permission to ban members.");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("Please mention a user to ban.");
        }

        if (!member.bannable) {
            return msg.reply("I cannot ban this user.");
        }

        await member.ban();
        msg.reply(`${member.user.tag} has been banned.`);
    }

    // Mute command (using a role named "Muted")
    if (command === "mute") {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return msg.reply("You don't have permission to mute members.");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("Please mention a user to mute.");
        }

        const muteRole = msg.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) {
            return msg.reply("Please create a role named 'Muted' to use this command.");
        }

        // Store the user's current roles
        const userRoles = member.roles.cache.filter(role => role.name !== "@everyone").map(role => role.id);
        mutedUsers.set(member.id, userRoles);

        // Remove all roles and assign the Muted role
        await member.roles.set([muteRole.id]);
        msg.reply(`${member.user.tag} has been muted.`);
    }

    // Unmute command
    if (command === "unmute") {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return msg.reply("You don't have permission to unmute members.");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("Please mention a user to unmute.");
        }

        const muteRole = msg.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) {
            return msg.reply("Please create a role named 'Muted' to use this command.");
        }

        // Check if the user was muted
        if (!mutedUsers.has(member.id)) {
            return msg.reply("This user is not muted.");
        }

        // Restore the user's roles
        const userRoles = mutedUsers.get(member.id);
        await member.roles.set(userRoles);

        // Remove the Muted role
        await member.roles.remove(muteRole);

        // Remove the user from the mutedUsers map
        mutedUsers.delete(member.id);

        msg.reply(`${member.user.tag} has been unmuted.`);
    }

    // Clear command (delete messages)
    if (command === "clear") {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return msg.reply("You don't have permission to delete messages.");
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return msg.reply("Please provide a number between 1 and 100.");
        }

        await msg.channel.bulkDelete(amount + 1); // +1 to include the command message
        msg.reply(`Deleted ${amount} messages.`).then(replyMsg => {
            setTimeout(() => replyMsg.delete(), 5000); // Delete the reply after 5 seconds
        });
    }
});

client.login(BOT_TOKEN);
