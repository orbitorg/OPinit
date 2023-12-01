import Bridge from './utils/Bridge';
import { startBatch } from 'worker/batchSubmitter';
import { startOutput } from 'worker/outputSubmitter';
import { startExecutor } from 'worker/bridgeExecutor';
import { startChallenger } from 'worker/challenger';
import { Config } from 'config';
import { TxBot } from './utils/TxBot';

const config = Config.getConfig();

const SUBMISSION_INTERVAL = 10;
const FINALIZED_TIME = 10;
const L2_START_BLOCK_HEIGHT = 1;

async function setup() {
  await setupBridge(SUBMISSION_INTERVAL, FINALIZED_TIME, L2_START_BLOCK_HEIGHT);
}

async function setupBridge(
  submissionInterval: number,
  finalizedTime: number,
  l2StartBlockHeight: number
) {
  const bridge = new Bridge(
    submissionInterval,
    finalizedTime,
    l2StartBlockHeight,
    config.L2ID,
  );
  const UINIT_METADATA = '0x8e4733bdabcf7d4afc3d14f0dd46c9bf52fb0fce9e4b996c939e195b8bc891d9'

  await bridge.deployBridge(UINIT_METADATA);
  console.log('Bridge deployed');
}

async function startBot() {
  try {
    await Promise.all([
      // startBatch(),
      startExecutor(),
      // startChallenger(),
      // startOutput()
    ]);
  } catch (err) {
    console.log(err);
  }
}

async function startTxBot() {
  const txBot = new TxBot();

  try {
    // TODO: Make withdraw and claim sequentially
    await txBot.deposit(txBot.l1sender, txBot.l2receiver, 1_000);
    // await txBot.withdrawal(txBot.l2receiver, 100);          // WARN: run after deposit done
    // await txBot.claim(txBot.l1receiver, 1, 19); // WARN: run after withdrawal done
    console.log('tx bot done');
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  try {
    await setup();
    await startBot();
    await startTxBot();
  } catch (err) {
    console.log(err);
  }
}

if (require.main === module) {
  main();
}
