let handler = async (m, { jeeybtz, isAdmins, isBotAdmins, args, reply }) => {
  if (!m.isGroup) return reply(mess.group);
  if (!isAdmins) return reply(mess.admin);
  if (!isBotAdmins) return reply(mess.botAdmin);

  let user =
    m.quoted?.sender ||
    m.mentionedJid?.[0] ||
    (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

  if (!user) return reply('Tag atau reply pesan user yang mau dikeluarkan.');
  if (user === m.sender) return reply('😅 Ngapain kick diri sendiri ngab.');

  await jeeybtz.groupParticipantsUpdate(m.chat, [user], 'remove');
  return reply(`Berhasil mengeluarkan @${user.split('@')[0]} dari grup.`, { mentions: [user] });
};

handler.command = ['kick'];
handler.tags = ['group'];
handler.help = ['kick'];
export default handler;