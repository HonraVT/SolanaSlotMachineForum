// src/utils/qrGenerator.js
import fs from 'fs';
import path from 'path';
import qr from 'qr-image';
import config from '../src/config/environment.js';

const qrDir = path.join(process.cwd(), 'qr_images');

const lamportsToChips = config.LAMPORTS_TO_CHIPS;
const recipientAddress = config.APP_PUBLIC_KEY;

function generateQRCodes() {
    if (!fs.existsSync(qrDir)) {
        fs.mkdirSync(qrDir);
        console.log(`📂 Diretório "${qrDir}" criado.`);
    }

    for (const [lamports, chips] of Object.entries(lamportsToChips)) {
        const filename = path.join(qrDir, `${lamports}_lamports.png`);

        if (fs.existsSync(filename)) {
            console.log(`✅ QR code para ${lamports} lamports já existe, pulando...`);
            continue;
        }

        const solAmount = lamports / 1_000_000_000;

        const memo = `buy${chips}`;
        const paymentUrl = `solana:${recipientAddress}?amount=${solAmount}&memo=${encodeURIComponent(memo)}`;

        const qrPng = qr.image(paymentUrl, { type: 'png', size: 8, margin: 2 });

        const output = fs.createWriteStream(filename);
        qrPng.pipe(output);

        console.log(`🎯 QR code gerado: ${filename}`);
    }
}

generateQRCodes();
