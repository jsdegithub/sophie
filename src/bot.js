const {WechatyBuilder} = require('wechaty');
const QRCode = require('qrcode');

class SophieBot {
  constructor() {
    this.bot = WechatyBuilder.build({
      name: 'sophie-bot',
      puppet: 'wechaty-puppet-wechat',
      puppetOptions: {
        uos: true,
      },
    });
    // 存储定时任务
    this.scheduledTasks = new Map();
  }

  async start() {
    this.bot
      .on('scan', async (qrcode, status) => {
        console.log(`扫码状态: ${status}`);
        if (qrcode) {
          console.log('请扫描下面的二维码登录：');
          try {
            console.log(
              await QRCode.toString(qrcode, {
                type: 'terminal',
                small: true,
              })
            );
          } catch (err) {
            console.log('二维码生成失败，请使用链接扫码：');
          }
          console.log('\n或者点击链接扫码：');
          console.log(`https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`);
        }
      })
      .on('login', (user) => {
        console.log(`用户 ${user} 登录成功`);
        // 登录后发送欢迎消息给自己
        user.say('Sophie 机器人已启动，随时为您服务！');
      })
      .on('message', async (message) => {
        if (message.self()) {
          return;
        }

        const text = message.text().trim();
        const contact = message.talker();
        const room = message.room();
        console.log(`收到${room ? '群聊' : '私聊'}消息 - ${contact.name()}: ${text}`);

        try {
          await this.handleMessage(message);
        } catch (e) {
          console.error('处理消息时出错：', e);
          message.say('抱歉，处理消息时出现错误。');
        }
      })
      .on('room-join', async (room, inviteeList, inviter) => {
        const roomName = await room.topic();
        const inviteeName = inviteeList.map((c) => c.name()).join(', ');
        console.log(`群【${roomName}】新成员加入：${inviteeName}，邀请人：${inviter.name()}`);
        await room.say(`欢迎 ${inviteeName} 加入本群！我是群助手 Sophie~`);
      })
      .on('room-leave', async (room, leaverList) => {
        const roomName = await room.topic();
        const leaverName = leaverList.map((c) => c.name()).join(', ');
        console.log(`群【${roomName}】成员离开：${leaverName}`);
      })
      .on('error', (error) => {
        console.error('机器人发生错误：', error);
      });

    try {
      await this.bot.start();
      console.log('Sophie 机器人已启动');
    } catch (e) {
      console.error('启动失败:', e);
      console.error(e.stack);
    }
  }

  async handleMessage(message) {
    const text = message.text().trim();
    const contact = message.talker();
    const room = message.room();
    const isGroupMessage = !!room;

    // 指令处理
    if (text.startsWith('/')) {
      await this.handleCommand(message);
      return;
    }

    // 群聊消息处理
    if (isGroupMessage) {
      await this.handleGroupMessage(message);
      return;
    }

    // 私聊消息处理
    await this.handlePrivateMessage(message);
  }

  async handleCommand(message) {
    const text = message.text().trim();
    const [command, ...args] = text.slice(1).split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        await this.showHelp(message);
        break;
      case 'echo':
        await message.say(args.join(' '));
        break;
      case 'time':
        await message.say(new Date().toLocaleString('zh-CN'));
        break;
      default:
        await message.say('未知指令。发送 /help 查看可用指令列表。');
    }
  }

  async handleGroupMessage(message) {
    const text = message.text().trim();
    const room = message.room();
    const contact = message.talker();

    if (text.includes('@Sophie')) {
      await room.say('我在听，请说~', contact);
    }
  }

  async handlePrivateMessage(message) {
    const text = message.text().trim();

    if (text.includes('你好')) {
      await message.say('你好！我是Sophie，很高兴认识你！\n发送 /help 可以查看我的功能列表~');
    } else if (text.includes('再见')) {
      await message.say('再见！期待下次聊天！');
    } else {
      await message.say('收到你的消息了！\n提示：发送 /help 可以查看我的功能列表');
    }
  }

  async showHelp(message) {
    const helpText = `
Sophie 机器人指令列表：

1. 基础指令：
  /help - 显示此帮助信息
  /echo <文本> - 复读你的消息
  /time - 显示当前时间

2. 关键词：
  "你好" - 打个招呼
  "再见" - 说再见

3. 群聊功能：
  @Sophie - 呼叫机器人

更多功能持续开发中...
    `.trim();

    await message.say(helpText);
  }
}

module.exports = {SophieBot};
