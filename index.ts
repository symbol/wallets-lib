import {PDFDocument, PDFFont, PDFPage, rgb} from 'pdf-lib';
import {Account, NetworkType} from "symbol-sdk";
import * as fontkit from '@pdf-lib/fontkit'
import {ExtendedKey, MnemonicPassPhrase, Wallet} from "symbol-hd-wallets";
import {AccountQR, ContactQR, MnemonicQR, QRCode} from "symbol-qr-library";
import * as encodedFont from "./resources/encodedFont";
import * as encodedBasePdf from "./resources/encodedBasePdf";
import * as encodedBasePrivateKeyPdf from "./resources/encodedBasePrivateKeyPdf";

const GENERATION_HASH_SEED = '57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6';

const MNEMONIC_POSITION = {
    x: 184,
    y: 36
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

/**
 * Symbol Paper wallet class
 */
class SymbolPaperWallet {
    public mnemonic: MnemonicPassPhrase;
    public accounts: Account[];
    public network: NetworkType;

    constructor(mnemonic: MnemonicPassPhrase, accounts: Account[], network: NetworkType) {
        this.mnemonic = mnemonic;
        this.accounts = accounts;
        this.network = network;

        console.log(mnemonic.plain);
    }

    /**
     * Exports as a PDF Uin8Array
     */
    async toPdf(): Promise<Uint8Array> {
        const plainPdfFile = new Buffer(encodedBasePdf, 'base64');
        let pdfDoc = await PDFDocument.load(plainPdfFile);
        const notoSansFontBytes = new Buffer(encodedFont, 'base64');
        pdfDoc.registerFontkit(fontkit);
        const notoSansFont = await pdfDoc.embedFont(notoSansFontBytes);

        pdfDoc = await this.writeMnemonicPage(pdfDoc, notoSansFont);

        for (let account of this.accounts) {
            pdfDoc = await this.writeAccountPage(account, pdfDoc);
        }
        return pdfDoc.save();
    }

    /**
     * Writes the mnemonic page into the given pdfDoc
     * @param pdfDoc
     * @param font
     */
    private async writeMnemonicPage(pdfDoc: PDFDocument, font: PDFFont): Promise<PDFDocument> {
        const mnemonicSeed = this.mnemonic.toSeed().toString('hex');
        const xkey = ExtendedKey.createFromSeed(mnemonicSeed);
        const wallet = new Wallet(xkey);
        const accountPrivateKey = wallet.getChildAccountPrivateKey("m/44'/4343'/0'/0'/0'");
        const account = Account.createFromPrivateKey(accountPrivateKey, this.network);

        const pages = pdfDoc.getPages();
        const page = pages[0];
        await this.writeAddress(account.address.pretty(), page, font);

        const mnemonicWords = this.mnemonic.toArray();
        const firstMnemonic = mnemonicWords.slice(0, Math.round(mnemonicWords.length / 2));
        const secondMnemonic = mnemonicWords.slice(Math.round(mnemonicWords.length / 2), mnemonicWords.length);
        await this.writePrivateInfo([firstMnemonic.join(' '), secondMnemonic.join(' ')], page, font);

        const plainMnemonicQR = new MnemonicQR(this.mnemonic.plain, this.network, GENERATION_HASH_SEED);
        await this.writePrivateQR(plainMnemonicQR, pdfDoc, page);

        const contactQR = new ContactQR('Root account', account.publicKey, this.network, GENERATION_HASH_SEED);
        await this.writePublicQR(contactQR, pdfDoc, page);

        return pdfDoc;
    }

    /**
     * Writes the account page into the given pdfDoc
     * @param account
     * @param pdfDoc
     */
    private async writeAccountPage(account: Account, pdfDoc: PDFDocument): Promise<PDFDocument> {
        const newPlainPdfFile = new Buffer(encodedBasePrivateKeyPdf, 'base64');
        const newPdfDoc = await PDFDocument.load(newPlainPdfFile);
        const notoSansFontBytes = new Buffer(encodedFont, 'base64');
        newPdfDoc.registerFontkit(fontkit);
        const font = await newPdfDoc.embedFont(notoSansFontBytes);

        let accountPage = newPdfDoc.getPages()[0];
        await this.writeAddress(account.address.pretty(), accountPage, font);

        await this.writePrivateInfo([account.privateKey], accountPage, font);

        const accountQR = new AccountQR(account.privateKey, this.network, GENERATION_HASH_SEED);
        await this.writePrivateQR(accountQR, newPdfDoc, accountPage);

        const contactQR = new ContactQR('Symbol account', account.publicKey, this.network, GENERATION_HASH_SEED);
        await this.writePublicQR(contactQR, newPdfDoc, accountPage);

        [accountPage] = await pdfDoc.copyPages(newPdfDoc, [0]);
        pdfDoc.addPage(accountPage);
        return pdfDoc;
    }

    /**
     * Writes address into the given pdfDoc
     * @param address
     * @param page
     * @param font
     */
    private async writeAddress(address: string, page: PDFPage, font: PDFFont): Promise<PDFPage> {
        page.drawText(address, {
            x: ADDRESS_POSITION.x,
            y: ADDRESS_POSITION.y,
            size: 12,
            font: font,
            color: rgb(82/256, 0, 198/256),
        });
        return page;
    }

    /**
     * Writes private info into the pdfDoc
     * @param privateLines
     * @param page
     * @param font
     */
    private async writePrivateInfo(privateLines: string[], page: PDFPage, font: PDFFont): Promise<PDFPage> {
        for (let i=0; i < privateLines.length; i++) {
            page.drawText(privateLines[i], {
                x: MNEMONIC_POSITION.x,
                y: MNEMONIC_POSITION.y - (16 * i),
                size: 9,
                font: font,
                color: rgb(82/256, 0, 198/256),
            });
        }
        return page;
    }

    /**
     * Writes the private QR (mnemonic or private key) into the given pdfDoc
     * @param qr
     * @param pdfDoc
     * @param page
     */
    private async writePrivateQR(qr: QRCode, pdfDoc: PDFDocument, page: PDFPage): Promise<PDFPage> {
        const qrBase64 = await qr.toBase64().toPromise();
        const png = await pdfDoc.embedPng(qrBase64);

        page.drawImage(png, {
            x: MNEMONIC_QR_POSITION.x,
            y: MNEMONIC_QR_POSITION.y,
            width: MNEMONIC_QR_POSITION.width,
            height: MNEMONIC_QR_POSITION.height,
        });
        return page;
    }

    /**
     * Writes the public QR into the given pdfDoc
     * @param qr
     * @param pdfDoc
     * @param page
     */
    private async writePublicQR(qr: QRCode, pdfDoc: PDFDocument, page: PDFPage): Promise<PDFPage> {
        const qrBase64 = await qr.toBase64().toPromise();
        const png = await pdfDoc.embedPng(qrBase64);

        page.drawImage(png, {
            x: ADDRESS_QR_POSITION.x,
            y: ADDRESS_QR_POSITION.y,
            width: ADDRESS_QR_POSITION.width,
            height: ADDRESS_QR_POSITION.height,
        });
        return page;
    }

}

export { SymbolPaperWallet };
