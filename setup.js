import { modul } from '../module.js';
import readline from 'readline';
import * as logger from './logger.js';

const { fs, chalk } = modul;

function ask(text) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(text, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function collectOwnerConfig() {
  console.log(chalk.white.bold("Isi Data Owner & Bot"));
  console.log(chalk.gray("Data ini akan disimpan secara permanen di settings.js\n"));

  if (!global.ownernumber || global.ownernumber.trim() === "") {
    console.log(chalk.yellow("Daftarkan nomor owner (ex: 628xxxxxx): "));
    global.ownernumber = await ask("> ");
  }

  if (!global.ownername || global.ownername.trim() === "") {
    console.log(chalk.yellow("Siapa nama mu?: "));
    global.ownername = await ask("> ");
  }

  if (!global.nomorbot || global.nomorbot.trim() === "") {
    console.log(chalk.yellow("Masukkan nomor bot untuk pairing (ex: 628xxxxxx): "));
    global.nomorbot = await ask("> ");
  }

  const settingsPath = "./settings.js";
  let settingsContent = fs.existsSync(settingsPath) ? fs.readFileSync(settingsPath, "utf-8") : "";

  try {
    settingsContent = settingsContent
      .replace(/global\.ownernumber\s*=\s*(['"`]).*?\1/, `global.ownernumber = '${global.ownernumber}'`)
      .replace(/global\.ownername\s*=\s*(['"`]).*?\1/, `global.ownername = '${global.ownername}'`)
      .replace(/global\.nomorbot\s*=\s*(['"`]).*?\1/, `global.nomorbot = '${global.nomorbot}'`);
    fs.writeFileSync(settingsPath, settingsContent, "utf-8");
    logger.success("Data berhasil disimpan ke settings.js");
  } catch (err) {
    logger.error("Gagal menyimpan ke settings.js:", err);
  }
}

export { collectOwnerConfig };
