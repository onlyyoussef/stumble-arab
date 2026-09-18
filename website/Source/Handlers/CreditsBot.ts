import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } from "discord.js";
import { DashboardUser } from "../Models/DashboardUser";
import { ADMIN_IDS } from "../Utils/AdminHelpers";

const CREDITS_BOT_TOKEN = process.env.CREDITS_BOT_TOKEN || "";
const CREDITS_BOT_APP_ID = process.env.CREDITS_BOT_APP_ID || "";

// إنشاء البوت
export const creditsBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// الأوامر
const commands = [
  new SlashCommandBuilder()
    .setName('addcredits')
    .setDescription('إضافة كريديت لمستخدم')
    .addIntegerOption(option =>
      option
        .setName('userid')
        .setDescription('الـ User ID المكون من 5 أرقام')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('عدد الكريديت')
        .setRequired(true)
        .setMinValue(1)
    )
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('checkuser')
    .setDescription('عرض معلومات مستخدم')
    .addIntegerOption(option =>
      option
        .setName('userid')
        .setDescription('الـ User ID المكون من 5 أرقام')
        .setRequired(true)
    )
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('listusers')
    .setDescription('عرض كل المستخدمين')
    .addIntegerOption(option =>
      option
        .setName('page')
        .setDescription('رقم الصفحة')
        .setRequired(false)
        .setMinValue(1)
    )
    .toJSON(),
    
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('إحصائيات النظام')
    .toJSON()
];

// تسجيل الأوامر
async function registerCommands() {
  if (!CREDITS_BOT_TOKEN || !CREDITS_BOT_APP_ID) {
    console.log('⚠️ Credits Bot: Token or App ID not configured');
    return;
  }
  
  try {
    const rest = new REST({ version: '10' }).setToken(CREDITS_BOT_TOKEN);
    
    console.log('📝 Registering Credits Bot slash commands...');
    
    await rest.put(
      Routes.applicationCommands(CREDITS_BOT_APP_ID),
      { body: commands }
    );
    
    console.log('✅ Credits Bot slash commands registered!');
  } catch (error) {
    console.error('❌ Error registering Credits Bot commands:', error);
  }
}

// عند تشغيل البوت
creditsBot.once('ready', () => {
  console.log(`✅ Credits Bot logged in as ${creditsBot.user?.tag}`);
  registerCommands();
});

// معالجة الأوامر
creditsBot.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  // التحقق من الصلاحيات
  if (!ADMIN_IDS.includes(interaction.user.id)) {
    await interaction.reply({
      content: '❌ ليس لديك صلاحية لاستخدام هذا البوت!',
      ephemeral: true
    });
    return;
  }
  
  try {
    // /addcredits
    if (interaction.commandName === 'addcredits') {
      await interaction.deferReply({ ephemeral: true });
      
      const userId = interaction.options.getInteger('userid', true);
      const amount = interaction.options.getInteger('amount', true);
      
      // البحث عن المستخدم
      const user = await DashboardUser.findOne({ userId });
      
      if (!user) {
        await interaction.editReply({
          content: `❌ لم يتم العثور على مستخدم بالـ ID: **${userId}**`
        });
        return;
      }
      
      // إضافة الكريديت
      user.credits += amount;
      await user.save();
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ تمت إضافة الكريديت بنجاح')
        .addFields(
          { name: 'User ID', value: `${user.userId}`, inline: true },
          { name: 'Username', value: user.username, inline: true },
          { name: 'Discord ID', value: user.discordId, inline: true },
          { name: 'المبلغ المضاف', value: `+${amount.toLocaleString()}`, inline: true },
          { name: 'الرصيد الجديد', value: `${user.credits.toLocaleString()} Credits`, inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
      console.log(`💰 Admin ${interaction.user.tag} added ${amount} credits to User ${userId} (${user.username})`);
    }
    
    // /checkuser
    else if (interaction.commandName === 'checkuser') {
      await interaction.deferReply({ ephemeral: true });
      
      const userId = interaction.options.getInteger('userid', true);
      
      const user = await DashboardUser.findOne({ userId });
      
      if (!user) {
        await interaction.editReply({
          content: `❌ لم يتم العثور على مستخدم بالـ ID: **${userId}**`
        });
        return;
      }
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('👤 معلومات المستخدم')
        .addFields(
          { name: 'User ID', value: `${user.userId}`, inline: true },
          { name: 'Username', value: user.username, inline: true },
          { name: 'Discord ID', value: user.discordId, inline: false },
          { name: '💰 Credits', value: `${user.credits.toLocaleString()}`, inline: true },
          { name: '🏆 Tournaments', value: `${user.tournamentsCreated}`, inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`, inline: false },
          { name: '🕐 Last Activity', value: `<t:${Math.floor(user.lastActivity?.getTime() / 1000)}:R>`, inline: false }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    }
    
    // /listusers
    else if (interaction.commandName === 'listusers') {
      await interaction.deferReply({ ephemeral: true });
      
      const page = interaction.options.getInteger('page') || 1;
      const perPage = 10;
      const skip = (page - 1) * perPage;
      
      const totalUsers = await DashboardUser.countDocuments();
      const totalPages = Math.ceil(totalUsers / perPage);
      
      if (page > totalPages && totalPages > 0) {
        await interaction.editReply({
          content: `❌ الصفحة ${page} غير موجودة. آخر صفحة: ${totalPages}`
        });
        return;
      }
      
      const users = await DashboardUser.find()
        .sort({ credits: -1, tournamentsCreated: -1 })
        .skip(skip)
        .limit(perPage)
        .lean();
      
      if (users.length === 0) {
        await interaction.editReply({
          content: '❌ لا يوجد مستخدمين مسجلين'
        });
        return;
      }
      
      const description = users.map((user, index) => {
        const rank = skip + index + 1;
        return `**${rank}.** ID: \`${user.userId}\` | **${user.username}**\n💰 ${user.credits?.toLocaleString() || 0} Credits | 🏆 ${user.tournamentsCreated || 0} Tournaments`;
      }).join('\n\n');
      
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('👥 قائمة المستخدمين')
        .setDescription(description)
        .setFooter({ text: `الصفحة ${page} من ${totalPages} | إجمالي المستخدمين: ${totalUsers}` })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    }
    
    // /stats
    else if (interaction.commandName === 'stats') {
      await interaction.deferReply({ ephemeral: true });
      
      const totalUsers = await DashboardUser.countDocuments();
      const totalCredits = await DashboardUser.aggregate([
        { $group: { _id: null, total: { $sum: '$credits' } } }
      ]);
      const totalTournaments = await DashboardUser.aggregate([
        { $group: { _id: null, total: { $sum: '$tournamentsCreated' } } }
      ]);
      
      const topUsers = await DashboardUser.find()
        .sort({ credits: -1 })
        .limit(3)
        .lean();
      
      const topUsersText = topUsers.map((user, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        return `${medals[index]} **${user.username}** - ${user.credits.toLocaleString()} Credits`;
      }).join('\n');
      
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('📊 إحصائيات النظام')
        .addFields(
          { name: '👥 إجمالي المستخدمين', value: `${totalUsers.toLocaleString()}`, inline: true },
          { name: '💰 إجمالي الكريديت', value: `${(totalCredits[0]?.total || 0).toLocaleString()}`, inline: true },
          { name: '🏆 إجمالي البطولات', value: `${totalTournaments[0]?.total || 0}`, inline: true },
          { name: '🏅 أعلى 3 مستخدمين', value: topUsersText || 'لا يوجد', inline: false }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    }
    
  } catch (error: any) {
    console.error('Credits Bot command error:', error);
    
    if (interaction.deferred) {
      await interaction.editReply({
        content: '❌ حدث خطأ أثناء تنفيذ الأمر'
      });
    } else {
      await interaction.reply({
        content: '❌ حدث خطأ أثناء تنفيذ الأمر',
        ephemeral: true
      });
    }
  }
});

// تشغيل البوت
export async function startCreditsBot() {
  if (!CREDITS_BOT_TOKEN) {
    console.log('⚠️ Credits Bot: Token not configured, skipping...');
    return;
  }
  
  try {
    await creditsBot.login(CREDITS_BOT_TOKEN);
  } catch (error) {
    console.error('❌ Failed to start Credits Bot:', error);
  }
}
