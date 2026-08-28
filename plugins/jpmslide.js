import { generateWAMessageFromContent, generateWAMessage, proto } from "@whiskeysockets/baileys";
import fs from "fs";

let handler = async (m, { penting, jeeybtz, isCreator, text }) => {
  if (!isCreator) return m.reply("⚠️ Fitur ini hanya untuk Developer bot!")

  const allGroups = await jeeybtz.groupFetchAllParticipating()
  const groupIDs = Object.keys(allGroups)
  let sentCount = 0
  if (!groupIDs.length) return m.reply("❌ Tidak ada grup terdaftar.")

  const processMsg = await jeeybtz.sendMessage(m.chat, { text: `*⏳ Memproses JPM Slide...*\nJumlah grup: ${groupIDs.length}\nTipe: Carousel Slide` }, { quoted: m })

  // === DATA SLIDE ===
  const dataSlide = [
    {
      title: `</> ${global.ownername} Menyediakan </>`,
      caption: `*
* Script Bot telegram
* Nokos WhatsApp All Region (Tergantung Stok!)
* Jasa Fix/Edit/Rename & Tambah Fitur Script Bot telegram 
* Jasa Suntik Followers/Like/Views All Sosmed
* dan lain-lain tanya aja

* *Channel Testimoni :*
${global.linkSaluran}`,
      image: global.thumbbc,
      button: "💌 Hubungi Kami",
      source: "https://t.me/Jeeyhosting",
    },
    {
      title: "</> Cari stock nokos? Gaskeun di sini aja </>",
      caption: `
~ Bot kita on 24 jam nonstop, gak pernah libur
~ OTP gagal / susah masuk? Santuy, tombol cancel ready dalam 3 menit
~ Nomor kedetect merah? Cus pake VPN/proxy dulu ya
~ Semua gagal? Auto refund otomatis — saldo balik lagi ke kalian buat cari stock lain, gak perlu drama

Jangan cuma stuck nyari 1 layanan/negara doang bestie, kita punya RIBUAN layanan dari RATUSAN negara siap gaskeun kapan aja 🚀
`,
      image: global.thumbbc,
      button: "💤 ORDER nokos",
      source: "https://t.me/Jeeytsdbotd",
    },
    {
      title: "</> 📁 SCRIPT BOT TELEGRAM AUTO ORDER NOKOS - SELLER NOKOS </>",
      caption: `
Jualan nokos full otomatis, tinggal jalanin langsung cuan

Bukan sekadar bot jual OTP biasa — script ini dilengkapi sistem keamanan anti-tuyul, deposit otomatis, dan panel admin selevel produk premium. Cocok buat kamu yang mau mulai bisnis nokos tanpa pusing develop dari nol.

💰 Harga Asli: Rp.100,000
🥳Harga promo Rp.36,000
🔓 No Encrypt — 100% Full Source Code, bebas custom sepuasnya
🤝 Open nego — penurunan harga menyesuaikan benefit yang didapat

*FITUR UNGGULAN*
🤖 Dual Bot System — Bot User & Bot Admin jalan terpisah, anti-bentrok
💳 Deposit QRIS otomatis, status tervalidasi real-time
🛡️ Sistem Anti-Fraud — audit saldo semua user tiap 5 menit, anti tuyul!
🔁 Auto refund 100% kalau pesanan gagal/timeout
📦 Realtime stock & price update tiap 2-3 detik tanpa reload
🏆 Sistem Top User & leaderboard dengan diskon otomatis bertingkat
🎁 Sistem referral — bonus otomatis tiap ada undangan deposit
📢 Auto broadcast & podcast harga/stok ke channel maupun semua user
📡 Live monitor transaksi pending langsung dari panel admin
🛠️ Maintenance mode otomatis terjadwal + manual switch
🔒 Wajib join channel/grup sebelum bisa akses bot
🚫 Sistem blokir/unblokir user lengkap dengan alasan
💾 Auto backup database ke channel Telegram tiap 10 menit
🧩 Struktur kode rapi, gampang dikembangkan sendiri

*BONUS PEMBELIAN*
🛠️ Jasa setup bot sampai online & siap jualan
💬 Konsultasi konfigurasi awal (token, API key, channel)

*INFO TEKNIS*
• Bahasa: JavaScript (Node.js)
• Database: Lokal JSON, tanpa perlu setup database tambahan
• Pembayaran: QRIS via API
• Hosting: VPS / Panel Pterodactyl / Terminal termux
📌 Library: node-telegram-bot-api, Axios, Moment.js, fs-extra

*DUKUNGAN & LISENSI*
✅ Bantuan setup & deploy gratis via Telegram/WhatsApp
✅ Developer License / Rebrand Ready

🎬 Demo: https://t.me/ReceOTPbot

🔥 Cocok buat reseller OTP, pebisnis nokos pemula, atau dev yang mau punya sistem jualan otomatis tanpa drama!
`,
      image: global.thumbbc,
      button: "💬 Order sekarang",
      source: "https://wa.me/message/DS6PVPWYESDTB1",
    },
  ]

  for (const id of groupIDs) {
    if (penting?.blacklistJpm?.includes(id)) continue
    try {
      const cards = []

      for (const item of dataSlide) {
        const imgMsg = await generateWAMessage(
          m.chat,
          { image: { url: item.image } },
          { upload: jeeybtz.waUploadToServer }
        )

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: item.caption || "",
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: item.title || "",
            hasMediaAttachment: true,
            imageMessage: imgMsg.message.imageMessage,
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: item.button || "Open",
                  url: item.source || "https://jeeymarket.my.id",
                }),
              },
            ],
          }),
        })
      }

      const bot = generateWAMessageFromContent(
        id,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                body: proto.Message.InteractiveMessage.Body.create({
                  text: `*All Transaksi Open*\n*Cek Produk Kami Dibawah Ini*`,
                }),
               
                header: proto.Message.InteractiveMessage.Header.create({
                  hasMediaAttachment: false,
                }),
                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                  cards,
                }),
              }),
            },
          },
        },
        {}
      )

      await jeeybtz.relayMessage(id, bot.message, { messageId: bot.key.id })
      sentCount++
      await new Promise(resolve => setTimeout(resolve, global.delayJpm || 4000))
    } catch (err) {
      console.error(`❌ Gagal kirim ke ${id}:`, err)
    }
  }

  await jeeybtz.sendMessage(m.chat, { text: `✅ JPM Slide Selesai!*\nBerhasil terkirim ke *${sentCount}* grup dari total ${groupIDs.length}.` }, { edit: processMsg.key })
}

handler.help = ["jpmslide"]
handler.tags = ["owner"]
handler.command = ["jpmslide"]

export default handler;