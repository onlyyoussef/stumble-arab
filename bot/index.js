const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const fetch = require('node-fetch');

let config;
try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (e) {
  config = {};
}

config.token = process.env.BOT_TOKEN || config.token;
config.clientId = process.env.BOT_CLIENT_ID || config.clientId;
config.guildId = process.env.BOT_GUILD_ID || config.guildId;
config.apiUrl = process.env.API_URL || config.apiUrl || 'http://localhost:8080';
config.gameApiUrl = process.env.GAME_API_URL || config.gameApiUrl || 'http://localhost:3000';
config.adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean).length > 0
  ? process.env.ADMIN_USER_IDS.split(',')
  : config.adminUserIds || [];
config.webhookUrl = process.env.WEBHOOK_URL || config.webhookUrl || '';
config.gameServer = config.gameServer || { ip: '176.100.37.91', port: 30259 };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const API = config.apiUrl;
const GAME_API = config.gameApiUrl || 'http://localhost:3000';

async function apiRequest(path, method, body, token, baseUrl) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const url = (baseUrl || API) + path;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

const commands = [
  new SlashCommandBuilder()
    .setName('createtour')
    .setDescription('Create a new tournament')
    .addStringOption(opt => opt.setName('name').setDescription('Tournament name').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('mode')
        .setDescription('Team size')
        .setRequired(true)
        .addChoices(
          { name: 'Solo (1v1)', value: 1 },
          { name: 'Duo (2v2)', value: 2 },
          { name: 'Trio (3v3)', value: 3 },
          { name: 'Squad (4v4)', value: 4 }
        ))
    .addIntegerOption(opt =>
      opt.setName('region')
        .setDescription('Region')
        .setRequired(true)
        .addChoices(
          { name: 'NA East', value: 0 },
          { name: 'NA West', value: 1 },
          { name: 'Europe', value: 2 },
          { name: 'Asia', value: 3 },
          { name: 'Other', value: 4 }
        ))
    .addIntegerOption(opt =>
      opt.setName('max_players')
        .setDescription('Max participants (8, 16, 32, 64, 128)')
        .setRequired(true)
        .addChoices(
          { name: '8', value: 8 },
          { name: '16', value: 16 },
          { name: '32', value: 32 },
          { name: '64', value: 64 },
          { name: '128', value: 128 }
        ))
    .addStringOption(opt => opt.setName('map').setDescription('Map name').setRequired(false)
      .addChoices(
        { name: 'BlockDash', value: 'BlockDash' },
        { name: 'CannonEnvoy', value: 'CannonEnvoy' },
        { name: 'RocketBall', value: 'RocketBall' },
        { name: 'HoneyThief', value: 'HoneyThief' },
        { name: 'JellyClimbers', value: 'JellyClimbers' },
        { name: 'MapGodV2', value: 'MapGodV2' },
        { name: 'CrownRush', value: 'CrownRush' }
      ))
    .addIntegerOption(opt => opt.setName('rounds').setDescription('Number of rounds (1-10)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a player from the game')
    .addStringOption(opt => opt.setName('player_id').setDescription('Player Game ID').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Ban reason').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a player')
    .addStringOption(opt => opt.setName('player_id').setDescription('Player Game ID').setRequired(true)),

  new SlashCommandBuilder()
    .setName('tournaments')
    .setDescription('List all active tournaments'),

  new SlashCommandBuilder()
    .setName('players')
    .setDescription('List players in a tournament')
    .addStringOption(opt => opt.setName('tournament_id').setDescription('Tournament ID').setRequired(true)),

  new SlashCommandBuilder()
    .setName('addcredits')
    .setDescription('Add credits to a user (Admin only)')
    .addStringOption(opt => opt.setName('username').setDescription('Username').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount').setRequired(true)),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your credit balance'),

  new SlashCommandBuilder()
    .setName('server')
    .setDescription('Show game server connection info')
];

function isAdmin(userId) {
  return config.adminUserIds.includes(userId);
}

client.on('ready', async () => {
  console.log(`Bot logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    console.log('Deploying slash commands...');
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: commands.map(c => c.toJSON())
    });
    console.log('Slash commands deployed!');
  } catch (err) {
    console.error('Failed to deploy commands:', err.message);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user, options } = interaction;

  try {
    switch (commandName) {

      case 'createtour': {
        await interaction.deferReply();

        const name = options.getString('name');
        const mode = options.getInteger('mode');
        const region = options.getInteger('region');
        const maxParticipants = options.getInteger('max_players');
        const map = options.getString('map') || 'BlockDash';
        const rounds = options.getInteger('rounds') || 3;

        const result = await apiRequest('/api/tournaments/create', 'POST', {
          name, mode, region, maxParticipants, map, roundCount: rounds
        }, null);

        if (!result.success) {
          return interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor(0xED4245)
              .setTitle('Failed to Create Tournament')
              .setDescription(result.message || 'Unknown error')
              .setTimestamp()]
          });
        }

        const t = result.tournament;
        const embed = new EmbedBuilder()
          .setColor(0x57F287)
          .setTitle('Tournament Created!')
          .addFields(
            { name: 'Name', value: t.TournamentName || name, inline: true },
            { name: 'Mode', value: `${mode}v${mode}`, inline: true },
            { name: 'Region', value: String(region), inline: true },
            { name: 'Max Players', value: String(maxParticipants), inline: true },
            { name: 'Map', value: map, inline: true },
            { name: 'Rounds', value: String(rounds), inline: true },
            { name: 'ID', value: t.TournamentId || 'N/A', inline: false },
            { name: 'Server', value: `${config.gameServer.ip}:${config.gameServer.port}`, inline: false },
            { name: 'Credits Remaining', value: String(result.remainingCredits), inline: true }
          )
          .setFooter({ text: 'Stumble Arab' })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'ban': {
        if (!isAdmin(user.id)) {
          return interaction.reply({ content: 'Admin only!', ephemeral: true });
        }

        await interaction.deferReply();
        const playerId = options.getString('player_id');
        const reason = options.getString('reason') || 'No reason';

        const result = await apiRequest('/admin/ban', 'POST', {
          playerId, reason, bannedBy: user.tag
        }, null, GAME_API);

        const embed = new EmbedBuilder()
          .setColor(result.success ? 0xED4245 : 0xFEE75C)
          .setTitle(result.success ? 'Player Banned' : 'Ban Failed')
          .setDescription(result.message || (result.success ? `Banned ${playerId}` : 'Failed'))
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'unban': {
        if (!isAdmin(user.id)) {
          return interaction.reply({ content: 'Admin only!', ephemeral: true });
        }

        await interaction.deferReply();
        const playerId = options.getString('player_id');

        const result = await apiRequest('/admin/unban', 'POST', { playerId }, null, GAME_API);

        const embed = new EmbedBuilder()
          .setColor(result.success ? 0x57F287 : 0xFEE75C)
          .setTitle(result.success ? 'Player Unbanned' : 'Unban Failed')
          .setDescription(result.message || (result.success ? `Unbanned ${playerId}` : 'Failed'))
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'tournaments': {
        await interaction.deferReply();

        const data = await apiRequest('/api/tournaments', 'GET', null, null);

        if (!Array.isArray(data) || data.length === 0) {
          return interaction.editReply({ content: 'No tournaments found.' });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Active Tournaments')
          .setTimestamp();

        data.slice(0, 10).forEach(t => {
          embed.addFields({
            name: t.TournamentName || 'Unnamed',
            value: `ID: \`${t.TournamentId}\` | Status: ${t.Status === 0 ? 'Scheduled' : t.Status === 1 ? 'Active' : 'Done'} | Players: ${t.Players?.length || 0}`
          });
        });

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'players': {
        await interaction.deferReply();

        const tourId = options.getString('tournament_id');
        const result = await apiRequest(`/api/tournaments/${tourId}/players`, 'GET', null, null);

        if (!result.success || !result.players?.length) {
          return interaction.editReply({ content: 'No players found in this tournament.' });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`Players - ${tourId}`)
          .setDescription(result.players.map(p => `**${p.username}** (${p.userId})`).join('\n').slice(0, 4000))
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'addcredits': {
        if (!isAdmin(user.id)) {
          return interaction.reply({ content: 'Admin only!', ephemeral: true });
        }

        await interaction.deferReply();
        const username = options.getString('username');
        const amount = options.getInteger('amount');

        const result = await apiRequest('/api/credits/add', 'POST', {
          username, amount
        }, null);

        const embed = new EmbedBuilder()
          .setColor(result.success ? 0x57F287 : 0xFEE75C)
          .setTitle(result.success ? 'Credits Added' : 'Failed')
          .setDescription(result.message || 'Failed')
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'balance': {
        await interaction.deferReply();

        const result = await apiRequest('/api/auth/me', 'GET', null, null);

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Your Balance')
          .setDescription(`**Credits:** ${result.user?.credits || 0}\n**Role:** ${result.user?.role || 'user'}`)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        break;
      }

      case 'server': {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('Stumble Arab Server')
          .addFields(
            { name: 'Server IP', value: `\`${config.gameServer.ip}:${config.gameServer.port}\``, inline: true },
            { name: 'Status', value: 'Online', inline: true },
            { name: 'Website', value: `http://localhost:8080`, inline: false },
            { name: 'Login', value: 'Username: `1234` | Password: `12345`', inline: false }
          )
          .setFooter({ text: 'Stumble Arab' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;
      }
    }
  } catch (err) {
    console.error(`Error in ${commandName}:`, err);
    const reply = {
      embeds: [new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('Error')
        .setDescription(err.message || 'Something went wrong')
        .setTimestamp()]
    };
    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

client.login(config.token);
