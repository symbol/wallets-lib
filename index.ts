import {PDFDocument, rgb} from 'pdf-lib';
import {NetworkType} from "symbol-sdk";
import * as fontkit from '@pdf-lib/fontkit'
import {ExtendedKey, MnemonicPassPhrase, Wallet} from "symbol-hd-wallets";
import {ContactQR, ObjectQR} from "symbol-qr-library";
import * as encodedFont from "./resources/encodedFont";
import * as encodedBasePdf from "./resources/encodedBasePdf";

const GENERATION_HASH_SEED = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';

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
    const account = wallet.getChildAccount("m/44'/4343'/0'/0'/0'", network);

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

    const plainMnemonicQR = new ObjectQR({ plainMnemonic: mnemonic.plain }, network, GENERATION_HASH_SEED);
    const qrBase64 = await plainMnemonicQR.toBase64().toPromise();
    const menmonicPng = await pdfDoc.embedPng(qrBase64);

    page.drawImage(menmonicPng, {
        x: MNEMONIC_QR_POSITION.x,
        y: MNEMONIC_QR_POSITION.y,
        width: MNEMONIC_QR_POSITION.width,
        height: MNEMONIC_QR_POSITION.height,
    });

    const contactQR = new ContactQR('Symbol Opt In', account.publicAccount, network, GENERATION_HASH_SEED);
    const contactQrBase64 = await contactQR.toBase64().toPromise();
    const contactPng = await pdfDoc.embedPng(contactQrBase64);

    page.drawImage(contactPng, {
        x: ADDRESS_QR_POSITION.x,
        y: ADDRESS_QR_POSITION.y,
        width: ADDRESS_QR_POSITION.width,
        height: ADDRESS_QR_POSITION.height,
    });

    return pdfDoc.save();
};

export { generatePaperWallet };
