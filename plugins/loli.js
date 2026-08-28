let handler = async (m, { jeeybtz }) => {
    return jeeybtz.sendButton(m.chat, {
        text: "Silakan pilih menu di bawah ini.",
        footer: global.foother,
        buttons: [
            { id: "menu", text: "📜 Lihat Menu" }
        ],
    }, { quoted: m });
};

handler.command = ["loli"]
export default handler 