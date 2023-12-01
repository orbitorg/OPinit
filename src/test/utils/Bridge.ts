import { MsgExecute } from '@initia/initia.js';

import { getDB, initORM } from 'worker/bridgeExecutor/db';
import { DataSource, EntityManager } from 'typeorm';
import {
  ExecutorCoinEntity,
  ExecutorOutputEntity,
  StateEntity,
  ExecutorWithdrawalTxEntity
} from 'orm';
import { getConfig } from 'config';
import { executor, challenger, outputSubmitter, bcs } from './helper';
import { sendTx } from 'lib/tx';

const config = getConfig();

class Bridge {
  db: DataSource;
  submissionInterval: number;
  finalizedTime: number;
  l2StartBlockHeight: number;
  l1BlockHeight: number;
  l2BlockHeight: number;
  l2id: string;

  constructor(
    submissionInterval: number,
    finalizedTime: number,
    l2StartBlockHeight: number,
    l2id: string,
  ) {
    [this.db] = getDB();
    this.submissionInterval = submissionInterval;
    this.finalizedTime = finalizedTime;
    this.l2StartBlockHeight = l2StartBlockHeight;
    this.l2id = l2id;
  }

  async init() {
    await this.setDB();
  }

  async setDB() {
    const l2Monitor = `executor_l2_monitor`;
    this.l2BlockHeight = parseInt(
      (await config.l2lcd.tendermint.blockInfo()).block.header.height
    );
    this.l2BlockHeight = Math.floor(this.l2BlockHeight / 100) * 100;

    // remove and initialize
    await this.db.transaction(
      async (transactionalEntityManager: EntityManager) => {
        await transactionalEntityManager.getRepository(StateEntity).clear();
        await transactionalEntityManager
          .getRepository(ExecutorWithdrawalTxEntity)
          .clear();
        await transactionalEntityManager
          .getRepository(ExecutorCoinEntity)
          .clear();
        await transactionalEntityManager
          .getRepository(ExecutorOutputEntity)
          .clear();
        await transactionalEntityManager
          .getRepository(StateEntity)
          .save({ name: l2Monitor, height: this.l2BlockHeight - 1 });
      }
    );
  }

  bridgeInitializeMsg(
    submissionInterval: number,
    finalizedTime: number,
    l2StartBlockHeight: number
  ) {
    return new MsgExecute(
      executor.key.accAddress,
      '0x1',
      'op_bridge',
      'initialize',
      [],
      [
        bcs.serialize('string', this.l2id),
        bcs.serialize('u64', submissionInterval),
        bcs.serialize('address', outputSubmitter.key.accAddress),
        bcs.serialize('address', challenger.key.accAddress),
        bcs.serialize('u64', finalizedTime),
        bcs.serialize('u64', l2StartBlockHeight)
      ]
    );
  }

  bridgeRegisterTokenMsg(metadata: string) {
    return new MsgExecute(
      executor.key.accAddress,
      '0x1',
      'op_bridge',
      'register_token',
      [],
      [bcs.serialize('string', this.l2id), bcs.serialize('object', metadata)]
    );
  }

  async tx(metadata: string) {
    const msgs = [
      this.bridgeInitializeMsg(
        this.submissionInterval,
        this.finalizedTime,
        this.l2StartBlockHeight
      ),
      this.bridgeRegisterTokenMsg(metadata)
    ];
    await sendTx(executor, msgs);
  }

  async deployBridge(metadata: string) {
    await initORM();
    const bridge = new Bridge(
      this.submissionInterval,
      this.finalizedTime,
      this.l2StartBlockHeight,
      this.l2id,
    );
    await bridge.init();
    await bridge.tx(metadata);
  }
}

export default Bridge;
