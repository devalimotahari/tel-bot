import { TelegrafContext } from './types/telegraf';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config as donEnvConfig } from 'dotenv';
import createRequirementDirectories, { loadAdminsFile } from './utils/dir';
import handleCleanUp from './utils/cleanup';
import { removeValueFromArray } from './utils/array';

donEnvConfig();
createRequirementDirectories();
loadAdminsFile();

const adminIds = loadAdminsFile();

const waitForAddAdmin: number[] = [];

const bot = new Telegraf<TelegrafContext>(process.env.BOT_TOKEN!, {
  telegram: {
    apiMode: 'bot',
  },
});
bot.use(async (ctx, next) => {
  console.log({ adminIds, userId: ctx.from?.id });
  if (ctx.from?.username && !adminIds.includes(ctx.from.id)) {
    for (let adminId of adminIds) {
      const msg = await bot.telegram.sendMessage(adminId, `@${ctx.from?.username} sent a message : `);
      if (ctx.message && 'text' in ctx.message) {
        await ctx.telegram.sendMessage(adminId, ctx.message.text, { reply_to_message_id: msg.message_id });
      }
    }
  }
  await next();
});

bot.command('addAdmin', async (ctx, next) => {
  if (!adminIds.includes(ctx.from.id)) return next();
  waitForAddAdmin.push(ctx.from.id);
  await ctx.reply('باشه! آیدی این رفیقمونو بفرس ببینیم کی قراره مدیرمون بشه!', {
    reply_markup: {
      force_reply: true,
      input_field_placeholder: 'حواست باشه فقط آیدیو بفرسیا ...',
    },
  });
});


bot.start((ctx) => ctx.reply(`به! ${ctx.from.first_name} جون خوش اومدی! ${ctx.from.is_premium ? `\n می‌بینم که پرمیوم هم هستی!` : ''} `));

bot.on(message('sticker'), (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.on(message('text'), async (ctx: TelegrafContext) => {
  if (ctx.from?.id && waitForAddAdmin.includes(ctx.from.id)) {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('داداچ فقط آیدیو بفرست!', {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'حواست باشه فقط آیدیو بفرسیا ...',
        },
      });
      return;
    }
    if (ctx.message.text === '/cancel') {
      await ctx.reply('پس چرا الکی وقت منو میگیری‌!');
      removeValueFromArray(waitForAddAdmin, ctx.from.id);
      return;
    }
    const parsedId = parseInt(ctx.message.text);
    if (ctx.message.text.length !== 9 || Number.isNaN(parsedId)) {
      await ctx.reply('داداچ فقط آیدیو بفرست!', {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Reply with your answer:',
        },
      });
      return;
    }
    if (adminIds.includes(parsedId)) {
      await ctx.reply('قبلا این داداشمون ادمین بوده!');
      removeValueFromArray(waitForAddAdmin, ctx.from.id);
      return;
    }
    adminIds.push(parsedId);
    if (removeValueFromArray(waitForAddAdmin, ctx.from.id)) {
      ctx.reply('حله داداچ!');
    } else {
      console.error(`Error while removing id (${ctx.from.id}) from`, { waitForAddAdmin, adminId: ctx.from.id });
      ctx.reply('ببخشید داداچ یه مشکلی این وسط پیش اومده. لاگ سرور رو چک کن شاید سر در بیاری!');
    }
  }
});


bot.launch().then(() => {
  console.log('bot started!');
});
bot.catch(async (err) => {
  for (let adminId of adminIds) {
    const msg = await bot.telegram.sendMessage(adminId, 'an error occurs:');
    await bot.telegram.sendMessage(adminId, ` \`\`\` ${JSON.stringify(err)} \`\`\` `, { reply_to_message_id: msg.message_id });
  }
});

const exitHandler = (exitCode?: string) => {
  return handleCleanUp({ adminIds });
};

//do something when app is closing
process.on('exit', () => exitHandler());

//catches ctrl+c event
process.on('SIGINT', () => exitHandler('SIGINT'));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', () => exitHandler());
process.on('SIGUSR2', () => exitHandler());

//catches uncaught exceptions
process.on('uncaughtException', () => exitHandler());

process.on('SIGTERM', () => exitHandler('SIGTERM'));