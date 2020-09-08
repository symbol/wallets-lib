import {PDFDocument, rgb} from 'pdf-lib';
import {NetworkType} from "symbol-sdk";
import * as fontkit from '@pdf-lib/fontkit'
import {ExtendedKey, MnemonicPassPhrase, Wallet} from "symbol-hd-wallets";
import {MnemonicQR, ObjectQR} from "symbol-qr-library";
import * as encodedFont from "./resources/encodedFont";
import * as encodedBasePdf from "./resources/encodedBasePdf";

const MNEMONIC_POSITION = {
    x: 184,
    y: 20
};

const ADDRESS_POSITION = {
    x: 184,
    y: 90
};

const MNEMONIC_QR_POSITION = {
    x: 264,
    y: 159,
    width: 99,
    height: 99,
};

const ADDRESS_QR_POSITION = {
    x: 418,
    y: 159,
    width: 99,
    height: 99,
};

const generatePaperWallet = async (mnemonic: MnemonicPassPhrase, network: NetworkType): Promise<Uint8Array> => {
    const plainPdfFile = new Buffer(encodedBasePdf, 'base64');
    const pdfDoc = await PDFDocument.load(plainPdfFile);

    const mnemonicSeed = mnemonic.toSeed().toString('hex');
    const xkey = ExtendedKey.createFromSeed(mnemonicSeed);
    const wallet = new Wallet(xkey);
    const account = wallet.getChildAccount(undefined, network);

    const notoSansFontBytes = new Buffer(encodedFont, 'base64');

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
    const firstMnemonic = mnemonicWords.slice(0, Math.round(mnemonicWords.length / 2));
    const secondMnemonic = mnemonicWords.slice(Math.round(mnemonicWords.length / 2), mnemonicWords.length);

    page.drawText(firstMnemonic.join(' '), {
        x: MNEMONIC_POSITION.x,
        y: MNEMONIC_POSITION.y + 9 + 7,
        size: 9,
        font: notoSansFont,
        color: rgb(82/256, 0, 198/256),
    });
    page.drawText(secondMnemonic.join(' '), {
        x: MNEMONIC_POSITION.x,
        y: MNEMONIC_POSITION.y,
        size: 9,
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
