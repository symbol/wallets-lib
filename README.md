# Symbol Paper Wallets

Symbol paper wallet generator

1. [Installation](#installation)
2. [Usage](#usage)

## Installation <a name="installation"></a>

To install the npm module on your typescript or node project run:

`npm install symbol-paper-wallets --save`

And install plugin dependencies:

`npm install symbol-sdk symbol-hd-wallets --save`

## Usage <a name="usage"></a>

Prepare some constants for use the module:

```javascript
import { SymbolPaperWallet } from 'symbol-paper-wallet'; 
import { MnemonicPassPhrase } from "symbol-hd-wallets"; 
import { Account, NetworkType } from "symbol-sdk";

const paperWallet = new SymbolPaperWallet(MnemonicPassPhrase.createRandom(), Account.generateNewAccount(NetworkType.TEST_NET), NetworkType.TEST_NET)

const uint8Array = await paperWallet.toPdf();

```
