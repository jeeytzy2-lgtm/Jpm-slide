import {
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  jidDecode,
  proto,
} from '@whiskeysockets/baileys';

import { getBuffer, getSizeMedia } from './myfunc.js';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid, exifAvatar } from './exif.js';
import haruka from '@ryuu-reinzz/luna-lib';
import * as baileysLib from '@whiskeysockets/baileys';
import * as logger from './logger.js';

function normalizeNumber(jid = '') {
  return jid.split('@')[0].split(':')[0];
}

async function initLidOwner(jeeybtz) {
  if (global.lidownernumber) return global.lidownernumber;

  const jid = global.ownernumber + "@s.whatsapp.net";
  const lid = await jeeybtz.signalRepository.lidMapping.getLIDForPN(jid);

  global.lidownernumber = lid.split("@")[0];
  return global.lidownernumber;
}

function attachCallHandler(jeeybtz, { previewAd, sleep }) {
  jeeybtz.ev.on("call", async (user) => {
    if (!global.anticall) return;
    for (const ff of user) {
      if (ff.isGroup === false && ff.status === "offer") {
        const sendcall = await jeeybtz.sendMessage(ff.from, {
          text: `@${ff.from.split("@")[0]} Maaf Kamu Akan Saya Block Karna Ownerbot Menyalakan Fitur *Anticall*\nJika Tidak Sengaja Segera Hubungi Owner Untuk Membuka Blokiran Ini`,
          contextInfo: previewAd({
            title: "｢ CALL DETECTED ｣",
            body: global.namabot,
            thumbnail: global.img,
            sourceUrl: global.web,
            mention: [ff.from],
          }),
        }, { quoted: null });
        jeeybtz.sendContact(ff.from, [global.ownernumber], sendcall);
        await sleep(10000);
        await jeeybtz.updateBlockStatus(ff.from, "block");
      }
    }
  });
}

function attachSocketHelpers(jeeybtz, deps) {
  const { fs, fileTypeFromBuffer, PhoneNumber, store, axios } = deps;

  try {
    haruka.addProperty(jeeybtz, baileysLib);
  } catch (err) {
    logger.warn('luna-lib gagal di-inject ke socket, fitur previewThumbnail/Button/Carousel mungkin tidak bekerja optimal.');
  }

  jeeybtz.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + '@' + decode.server) ||
        jid
      );
    } else return jid;
  };

  jeeybtz.isOwnerJid = (jid) => {
    if (!jid) return false;
    const num = normalizeNumber(jid);
    const owners = String(global.ownernumber || '').split(',').map((v) => v.trim());
    const lidOwners = String(global.lidownernumber || '').split(',').map((v) => v.trim());
    const bots = String(global.nomorbot || '').split(',').map((v) => v.trim());
    return owners.includes(num) || lidOwners.includes(num) || bots.includes(num);
  };

  jeeybtz.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
    jeeybtz.sendMessage(
      jid,
      {
        text,
        contextInfo: {
          mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map((v) => v[1] + '@s.whatsapp.net'),
        },
        ...options,
      },
      { quoted },
    );

  jeeybtz.ev.on('contacts.update', (update) => {
    for (const contact of update) {
      const id = jeeybtz.decodeJid(contact.id);
      if (store && store.contacts) {
        store.contacts[id] = { id, name: contact.notify };
      }
    }
  });

  jeeybtz.getName = (jid, withoutContact = false) => {
    const id = jeeybtz.decodeJid(jid);
    withoutContact = jeeybtz.withoutContact || withoutContact;
    let v;
    if (id.endsWith('@g.us')) {
      return new Promise(async (resolve) => {
        v = (store && store.contacts && store.contacts[id]) || {};
        if (!(v.name || v.subject)) {
          try {
            v = (await jeeybtz.groupMetadata(id)) || {};
          } catch {
            v = {};
          }
        }
        resolve(
          v.name ||
            v.subject ||
            PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'),
        );
      });
    }
    v =
      id === '0@s.whatsapp.net'
        ? { id, name: 'WhatsApp' }
        : id === jeeybtz.decodeJid(jeeybtz.user.id)
          ? jeeybtz.user
          : (store && store.contacts && store.contacts[id]) || {};
    return (
      (withoutContact ? '' : v.name) ||
      v.subject ||
      v.verifiedName ||
      PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    );
  };

  jeeybtz.parseMention = (text = '') => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + '@s.whatsapp.net');
  };

  jeeybtz.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    const list = [];
    for (const i of kon) {
      const displayName = await jeeybtz.getName(i);
      list.push({
        displayName,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${displayName}\nFN:${displayName}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:${global.namabot}\nitem2.X-ABLabel:Bot\nitem3.URL:${global.web}\nitem3.X-ABLabel:Website\nitem4.ADR:;;${global.ownername};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`,
      });
    }
    return jeeybtz.sendMessage(
      jid,
      { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts },
      { quoted },
    );
  };

  jeeybtz.setStatus = (status) => {
    jeeybtz.query({
      tag: 'iq',
      attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
      content: [{ tag: 'status', attrs: {}, content: Buffer.from(status, 'utf-8') }],
    });
    return status;
  };

  async function resolveBuffer(source) {
    if (Buffer.isBuffer(source)) return source;
    if (/^data:.*?\/.*?;base64,/i.test(source)) return Buffer.from(source.split(',')[1], 'base64');
    if (/^https?:\/\//.test(source)) return await getBuffer(source);
    if (fs.existsSync(source)) return fs.readFileSync(source);
    return Buffer.alloc(0);
  }

  jeeybtz.sendImage = async (jid, source, caption = '', quoted = '', options) => {
    const buffer = await resolveBuffer(source);
    return jeeybtz.sendMessage(jid, { image: buffer, caption, ...options }, { quoted });
  };

  jeeybtz.sendImageAsSticker = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const buffer =
      options && (options.packname || options.author)
        ? await writeExifImg(buff, options)
        : await imageToWebp(buff);
    return jeeybtz.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted }).then((response) => {
      if (typeof buffer === 'string' && fs.existsSync(buffer)) fs.unlinkSync(buffer);
      return response;
    });
  };

  jeeybtz.sendVideoAsSticker = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const buffer =
      options && (options.packname || options.author)
        ? await writeExifVid(buff, options)
        : await videoToWebp(buff);
    await jeeybtz.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
    return buffer;
  };

  jeeybtz.sendImageAsStickerAvatar = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const webp = await imageToWebp(buff);
    const buffer = await exifAvatar(webp, options.packname || '', options.author || '');
    return jeeybtz.sendMessage(jid, { sticker: buffer, ...options }, { quoted });
  };

  jeeybtz.sendVideoAsStickerAvatar = async (jid, source, quoted, options = {}) => {
    const buff = await resolveBuffer(source);
    const webp = await videoToWebp(buff);
    const buffer = await exifAvatar(webp, options.packname || '', options.author || '');
    return jeeybtz.sendMessage(jid, { sticker: buffer, ...options }, { quoted });
  };

  jeeybtz.copyNForward = async (jid, message, forceForward = false, options = {}) => {
    if (options.readViewOnce) {
      message.message =
        message.message?.ephemeralMessage?.message || message.message || undefined;
      const vtype = Object.keys(message.message.viewOnceMessage.message)[0];
      delete message.message.viewOnceMessage.message[vtype].viewOnce;
      message.message = { ...message.message.viewOnceMessage.message };
    }
    const mtype = Object.keys(message.message)[0];
    const content = await generateForwardMessageContent(message, forceForward);
    const ctype = Object.keys(content)[0];
    let context = {};
    if (mtype != 'conversation') context = message.message[mtype].contextInfo;
    content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
    const waMessage = await generateWAMessageFromContent(
      jid,
      content,
      options
        ? {
            ...content[ctype],
            ...options,
            ...(options.contextInfo
              ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } }
              : {}),
          }
        : {},
    );
    await jeeybtz.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
    return waMessage;
  };

  jeeybtz.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    const quoted = message.msg ? message.msg : message;
    const mime = (message.msg || message).mimetype || '';
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    const type = await fileTypeFromBuffer(buffer);
    const isAudio = type?.ext === 'ogg' || type?.ext === 'opus';
    const trueFileName = attachExtension ? `${filename}.${isAudio ? 'mp3' : type?.ext || 'bin'}` : filename;
    fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };

  jeeybtz.downloadMediaMessage = async (message) => {
    const mime = (message.msg || message).mimetype || '';
    const messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
  };

  jeeybtz.getFile = async (source, save) => {
    let res;
    let filename;
    let data;
    if (Buffer.isBuffer(source)) {
      data = source;
    } else if (/^data:.*?\/.*?;base64,/i.test(source)) {
      data = Buffer.from(source.split(',')[1], 'base64');
    } else if (/^https?:\/\//.test(source)) {
      res = await getBuffer(source);
      data = res;
    } else if (fs.existsSync(source)) {
      filename = source;
      data = fs.readFileSync(source);
    } else {
      data = typeof source === 'string' ? source : Buffer.alloc(0);
    }
    const type = (await fileTypeFromBuffer(data)) || { mime: 'application/octet-stream', ext: 'bin' };
    if (data && save && filename) fs.promises.writeFile(filename, data);
    return { res, filename, size: await getSizeMedia(data), ...type, data };
  };

  jeeybtz.sendText = (jid, text, quoted = '', options) =>
    jeeybtz.sendMessage(jid, { text, ...options }, { quoted });

  jeeybtz.sendFile = async (jid, media, options = {}) => {
    const file = await jeeybtz.getFile(media);
    let type;
    switch (file.ext) {
      case 'mp3':
        type = 'audio';
        options.mimetype = 'audio/mpeg';
        options.ptt = options.ptt || false;
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
        type = 'image';
        break;
      case 'webp':
        type = 'sticker';
        break;
      case 'mp4':
        type = 'video';
        break;
      default:
        type = 'document';
    }
    return jeeybtz.sendMessage(
      jid,
      { [type]: file.data, caption: options.caption || '', ...options },
      { quoted: options.quoted || '', ...options },
    );
  };

  jeeybtz.sendFileUrl = async (jid, url, caption, quoted, options = {}) => {
    const res = await axios.head(url);
    const mime = res.headers['content-type'] || '';
    const kind = mime.split('/')[0];

    if (mime.split('/')[1] === 'gif') {
      return jeeybtz.sendMessage(
        jid,
        { video: await getBuffer(url), caption, gifPlayback: true, ...options },
        { quoted, ...options },
      );
    }
    if (mime === 'application/pdf') {
      return jeeybtz.sendMessage(
        jid,
        { document: await getBuffer(url), mimetype: 'application/pdf', caption, ...options },
        { quoted, ...options },
      );
    }
    if (kind === 'image') {
      return jeeybtz.sendMessage(jid, { image: await getBuffer(url), caption, ...options }, { quoted, ...options });
    }
    if (kind === 'video') {
      return jeeybtz.sendMessage(
        jid,
        { video: await getBuffer(url), caption, mimetype: 'video/mp4', ...options },
        { quoted, ...options },
      );
    }
    if (kind === 'audio') {
      return jeeybtz.sendMessage(
        jid,
        { audio: await getBuffer(url), caption, mimetype: 'audio/mpeg', ...options },
        { quoted, ...options },
      );
    }
  };

  jeeybtz.sendButton = async (jid, content = {}, options = {}) => {
    if (!jeeybtz.user?.id) throw new Error('User not authenticated');

    const {
      text = '',
      caption = '',
      title = '',
      footer = '',
      buttons = [],
      hasMediaAttachment = false,
      image = null,
      video = null,
      document = null,
      mimetype = null,
      jpegThumbnail = null,
      location = null,
      product = null,
      businessOwnerJid = null,
    } = content;

    if (!Array.isArray(buttons) || buttons.length === 0) {
      throw new Error('buttons must be a non-empty array');
    }

    const interactiveButtons = [];
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (!btn || typeof btn !== 'object') throw new Error(`button[${i}] must be an object`);

      if (btn.name && btn.buttonParamsJson) {
        interactiveButtons.push(btn);
        continue;
      }
      if (btn.id || btn.text || btn.displayText) {
        interactiveButtons.push({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn.text || btn.displayText || `Button ${i + 1}`,
            id: btn.id || `quick_${i + 1}`,
          }),
        });
        continue;
      }
      if (btn.buttonId && btn.buttonText?.displayText) {
        interactiveButtons.push({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn.buttonText.displayText,
            id: btn.buttonId,
          }),
        });
        continue;
      }
      throw new Error(`button[${i}] has invalid shape`);
    }

    const messageContent = {};

    async function mediaHeader(kind, source) {
      const mediaInput = {};
      if (Buffer.isBuffer(source)) mediaInput[kind] = source;
      else if (typeof source === 'object' && source.url) mediaInput[kind] = { url: source.url };
      else if (typeof source === 'string') mediaInput[kind] = { url: source };
      return prepareWAMessageMedia(mediaInput, { upload: jeeybtz.waUploadToServer });
    }

    if (image) {
      const preparedMedia = await mediaHeader('image', image);
      messageContent.header = { title, hasMediaAttachment, imageMessage: preparedMedia.imageMessage };
    } else if (video) {
      const preparedMedia = await mediaHeader('video', video);
      messageContent.header = { title, hasMediaAttachment, videoMessage: preparedMedia.videoMessage };
    } else if (document) {
      const mediaInput = { document: {} };
      if (Buffer.isBuffer(document)) mediaInput.document = document;
      else if (typeof document === 'object' && document.url) mediaInput.document = { url: document.url };
      else if (typeof document === 'string') mediaInput.document = { url: document };

      if (mimetype && typeof mediaInput.document === 'object') mediaInput.document.mimetype = mimetype;

      if (jpegThumbnail && typeof mediaInput.document === 'object') {
        if (Buffer.isBuffer(jpegThumbnail)) {
          mediaInput.document.jpegThumbnail = jpegThumbnail;
        } else if (typeof jpegThumbnail === 'string') {
          try {
            mediaInput.document.jpegThumbnail = await getBuffer(jpegThumbnail);
          } catch {}
        }
      }

      const preparedMedia = await prepareWAMessageMedia(mediaInput, { upload: jeeybtz.waUploadToServer });
      messageContent.header = { title, hasMediaAttachment, documentMessage: preparedMedia.documentMessage };
    } else if (location && typeof location === 'object') {
      messageContent.header = {
        title: title || location.name || 'Location',
        hasMediaAttachment,
        locationMessage: {
          degreesLatitude: location.degreesLatitude || 0,
          degreesLongitude: location.degreesLongitude || 0,
          name: location.name || '',
          address: location.address || '',
        },
      };
    } else if (product && typeof product === 'object') {
      let productImageMessage = null;
      if (product.productImage) {
        const preparedMedia = await mediaHeader('image', product.productImage);
        productImageMessage = preparedMedia.imageMessage;
      }
      messageContent.header = {
        title: title || product.title || 'Product',
        hasMediaAttachment,
        productMessage: {
          product: {
            productImage: productImageMessage,
            productId: product.productId || '',
            title: product.title || '',
            description: product.description || '',
            currencyCode: product.currencyCode || 'USD',
            priceAmount1000: parseInt(product.priceAmount1000) || 0,
            retailerId: product.retailerId || '',
            url: product.url || '',
            productImageCount: product.productImageCount || 1,
          },
          businessOwnerJid: businessOwnerJid || product.businessOwnerJid || jeeybtz.user.id,
        },
      };
    } else if (title) {
      messageContent.header = { title, hasMediaAttachment: false };
    }

    const hasMedia = !!(image || video || document || location || product);
    const bodyText = hasMedia ? caption : text || caption;
    if (bodyText) messageContent.body = { text: bodyText };
    if (footer) messageContent.footer = { text: footer };
    messageContent.nativeFlowMessage = { buttons: interactiveButtons };

    const payload = proto.Message.InteractiveMessage.create(messageContent);
    const msg = generateWAMessageFromContent(
      jid,
      { viewOnceMessage: { message: { interactiveMessage: payload } } },
      { userJid: jeeybtz.user.id, quoted: options?.quoted || null },
    );

    const isGroup = jid.endsWith('@g.us');
    const additionalNodes = [
      {
        tag: 'biz',
        attrs: {},
        content: [
          {
            tag: 'interactive',
            attrs: { type: 'native_flow', v: '1' },
            content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }],
          },
        ],
      },
    ];
    if (!isGroup) additionalNodes.push({ tag: 'bot', attrs: { biz_bot: '1' } });

    await jeeybtz.relayMessage(jid, msg.message, { messageId: msg.key.id, additionalNodes });
    return msg;
  };

  return jeeybtz;
}

export { attachSocketHelpers, initLidOwner, attachCallHandler };
