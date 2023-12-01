import { delay } from "bluebird";
import { TxBot } from "./utils/TxBot";

async function main() {
    const txBot = new TxBot();
    for (let i=0;;i+=1) {
        try {   
        await txBot.deposit(txBot.l1sender, txBot.l2receiver, 1_000);
        console.log(`${i}th deposit done`);
        } catch (err) {
        console.log(err);
        } finally {
        await delay(60_000);
        }
    }
}

if (require.main === module) {
    main()
}