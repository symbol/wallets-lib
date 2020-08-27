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
import { generatePaperWallet } from 'symbol-paper-wallet'; 
import { MnemonicPassPhrase } from "symbol-hd-wallets"; 
import { NetworkType } from "symbol-sdk";

const uint8Array = await generatePaperWallet(MnemonicPassPhrase.createRandom(), NetworkType.MAIN_NET);

```
