import {PDFDocument, rgb} from 'pdf-lib';
import * as fs from "fs";
import {NetworkType} from "symbol-sdk";
import * as fontkit from '@pdf-lib/fontkit'
import {ExtendedKey, MnemonicPassPhrase, Wallet} from "symbol-hd-wallets";
import {MnemonicQR, ObjectQR} from "symbol-qr-library";

const MNEMONIC_POSITION = {
    x: 209,
    y: 23
};

const ADDRESS_POSITION = {
    x: 209,
    y: 102
};

const MNEMONIC_QR_POSITION = {
    x: 300,
    y: 181,
    width: 113,
    height: 113,
};

const ADDRESS_QR_POSITION = {
    x: 475,
    y: 181,
    width: 113,
    height: 113,
};

const generatePaperWallet = async (mnemonic: MnemonicPassPhrase, network: NetworkType): Promise<Uint8Array> => {
    const plainPdfFile = fs.readFileSync(__dirname + '/resources/symbol-paper-plain.pdf');
    const pdfDoc = await PDFDocument.load(plainPdfFile);

    const mnemonicSeed = mnemonic.toSeed().toString('hex');
    const xkey = ExtendedKey.createFromSeed(mnemonicSeed);
    const wallet = new Wallet(xkey);
    const account = wallet.getChildAccount(undefined, network);

    const notoSansFontBytes = fs.readFileSync(__dirname + '/resources/NotoSans-Medium.ttf');

    pdfDoc.registerFontkit(fontkit);
    const notoSansFont = await pdfDoc.embedFont(notoSansFontBytes);

    const pages = pdfDoc.getPages();
    const page = pages[0];

    page.drawText(account.address.pretty(), {
        x: ADDRESS_POSITION.x,
        y: ADDRESS_POSITION.y,
        size: 12,
        font: notoSansFont,
        color: rgb(82/256, 0, 198/256),
    });

    const mnemonicWords = mnemonic.toArray();
    const firstMnemonic = mnemonicWords.slice(0, mnemonicWords.length / 2);
    const secondMnemonic = mnemonicWords.slice((mnemonicWords.length / 2) + 1, mnemonicWords.length);

    page.drawText(firstMnemonic.join(' '), {
        x: MNEMONIC_POSITION.x,
        y: MNEMONIC_POSITION.y + 10 + 7,
        size: 10,
        font: notoSansFont,
        color: rgb(82/256, 0, 198/256),
    });
    page.drawText(secondMnemonic.join(' '), {
        x: MNEMONIC_POSITION.x,
        y: MNEMONIC_POSITION.y,
        size: 10,
        font: notoSansFont,
        color: rgb(82/256, 0, 198/256),
    });

    const mnemonicQR = new MnemonicQR(mnemonic, '', network, 'no-chain-id');
    const qrBase64 = await mnemonicQR.toBase64().toPromise();
    const menmonicPng = await pdfDoc.embedPng(qrBase64);

    page.drawImage(menmonicPng, {
        x: MNEMONIC_QR_POSITION.x,
        y: MNEMONIC_QR_POSITION.y,
        width: MNEMONIC_QR_POSITION.width,
        height: MNEMONIC_QR_POSITION.height,
    });

    const addressQR = new ObjectQR({ address: account.address.plain() }, network, 'no-chain-id');
    const addressQrBase64 = await addressQR.toBase64().toPromise();
    const addressPng = await pdfDoc.embedPng(addressQrBase64);

    page.drawImage(addressPng, {
        x: ADDRESS_QR_POSITION.x,
        y: ADDRESS_QR_POSITION.y,
        width: ADDRESS_QR_POSITION.width,
        height: ADDRESS_QR_POSITION.height,
    });

    return pdfDoc.save();
};

export { generatePaperWallet };
