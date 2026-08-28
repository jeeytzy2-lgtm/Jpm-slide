import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import moment from "moment-timezone";

//——————————[ Config Owner ]——————————//
// khusus owner number wajib restart tiap ada perubahan
global.ownernumber = '' // Ganti nomer mu
global.lidownernumber = null;
global.ownername = ''

//——————————[ Config Bot ]——————————//
global.namabot = "Jeeyhosting ⚡"
global.nomorbot = '628137743344' // Ganti no botmu
global.pair = "JEEYVIPP"
global.version = '6.2.3'
global.botMode = true // false = self, true = public
global.prefix = '°zZ#$@+,.?=\'\'():√%!¢£¥€π¤ΠΦ&><`™©®Δ^βα¦|/\\©^'

// false = nonaktif, true = aktif
global.autojoingc = false
global.anticall = false
global.autoreadsw = false
global.autoread = false

//——————————[ Config Sosmed ]——————————//
global.web = "https://jeeymarket.my.id"
global.linkSaluran = "https://whatsapp.com/channel/0029VahfcfF8qIzuDlQDce06"
global.idSaluran = "120363306722648374@newsletter"
global.nameSaluran = "Jeeyhosting Ch."

//——————————[ Config Wm ]——————————//
global.packname = `Di buat oleh Jeeyhosting ⚡ 
⏰ ${moment.tz("Asia/Makassar").format("HH:mm:ss")}
Sєωα вσт ρυѕнкσитαк? Cнαт: ${ownernumber}`
global.author = ``
global.foother = '© 2026 - Made By Zass Desuta'

//——————————[ Config Payment ]——————————//
// Note : Kalau gada isi aja jadi false
global.dana = "6283122028438"
global.ovo = false
global.gopay = false
global.qris = false
global.an = {
    dana: "nama_dana",
    ovo: "nama_ovo",
    gopay: "nama_gopay"
}

//——————————[ Config Media ]——————————//
global.img = "https://cdn.aceimg.com/sJoMj9Bty.jpg"
global.thumbxm = "https://cdn.aceimg.com/sJoMj9Bty.jpg"
global.thumbbc = "https://cdn.aceimg.com/sJoMj9Bty.jpg"
global.thumb = "https://cdn.aceimg.com/sJoMj9Bty.jpg"
global.favicon = "https://cdn.aceimg.com/sJoMj9Bty.jpg"

//——————————[ Config Broadcast ]——————————//
// Delay Jpm & Pushctc || 1000 = 1detik
global.delayJpm = 3500
global.delayPushkontak = 5000
global.namakontak = "AutoSave Jeeyhosting"

//——————————[ Config Message ]——————————//
global.mess = {
  success: 'Sєℓєѕαι. Bєянαѕιℓ ∂ιєкѕєкυѕι.',
  wait: 'Tυиɢɢυ ѕєвєитαя. Aкυ ѕє∂αиɢ вєкєяנα...',
  admin: 'Kαмυ вυкαи A∂мιи ∂ι ѕιиι.',
  botAdmin: 'Aкυ вєℓυм мєиנα∂ι A∂мιи ∂ι Gяσυρ ιиι.',
  creator: 'Kαмυ ѕιαρα? Pєяιитαн ιиι нαиуα υитυк Oωиєякυ.',
  group: 'Nɢɢαк вιѕα ∂ι ѕιиι. Pαкαι ∂ι Gяσυρ.',
  private: 'Pαкαι ∂ι Cнαт Pяιвαт αנα.',
  error: 'Tєяנα∂ι Eяяσя. Cσвα ℓαɢι.',
  limit: 'Lιмιтмυ нαвιѕ. Iѕтιяαнαт ∂υℓυ уα.',
}


// *** message *** 
global.closeMsgInterval = 30; // 30 menit. maksimal 60 menit, minimal 1 menit
global.backMsgInterval = 2; // 2 jam. maksimal 24 jam, minimal 1 jam


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let file = __filename;
fs.watchFile(file, async () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${file}`));
    try {
        const module = await import(`${file}?update=${Date.now()}`); 
    } catch (err) {
        console.error(err);
    }
});