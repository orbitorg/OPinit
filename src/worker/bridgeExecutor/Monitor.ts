import * as Bluebird from 'bluebird';
import { RPCClient, RPCSocket } from 'lib/rpc';
import { StateEntity } from 'orm';
import { DataSource } from 'typeorm';
import MonitorHelper from './MonitorHelper';
import winston from 'winston';
import { INTERVAL_MONITOR } from 'config';

export abstract class Monitor {
  public syncedHeight: number;
  protected db: DataSource;
  protected isRunning = false;
  helper: MonitorHelper = new MonitorHelper();
  constructor(
    public socket: RPCSocket,
    public rpcClient: RPCClient,
    public logger: winston.Logger
  ) {}

  public async run(): Promise<void> {
    const state = await this.db.getRepository(StateEntity).findOne({
      where: {
        name: this.name()
      }
    });

    if (!state) {
      await this.db
        .getRepository(StateEntity)
        .save({ name: this.name(), height: 0 });
    }
    this.syncedHeight = state?.height || 0;

    this.socket.initialize();
    this.isRunning = true;
    await this.monitor();
  }

  public stop(): void {
    this.socket.stop();
    this.isRunning = false;
  }

  public async monitor(): Promise<void> {
    while (this.isRunning) {
      try {
        const latestHeight = this.socket.latestHeight;
        if (!latestHeight || !(latestHeight > this.syncedHeight)) continue;

        const blockChain = await this.rpcClient.getBlockchain(
          this.syncedHeight + 1,
          // cap the query to fetch 20 blocks at maximum
          Math.min(latestHeight, this.syncedHeight + 20)
        );
        if (blockChain === null) continue;

        for (const metadata of blockChain?.block_metas.reverse()) {
          const nextHeight = this.syncedHeight + 1;
          if (nextHeight !== parseInt(metadata.header.height)) {
            this.logger.error(
              `try to fetch block meta for the height ${nextHeight}, but got ${metadata.header.height}`
            );
            break;
          }

          if (nextHeight % 10 === 0) {
            this.logger.info(`${this.name()} height ${nextHeight} txNum ${metadata.num_txs}`);
          }

          if (parseInt(metadata.num_txs) === 0) {
            this.syncedHeight++;
            continue;
          }

          const ok: boolean = await this.handleEvents();
          if (!ok) continue;

          await this.handleBlock();

          // TODO - should we put this before this.handleBlock()?
          this.syncedHeight++;

          // update state
          await this.db
            .getRepository(StateEntity)
            .update({ name: this.name() }, { height: this.syncedHeight });
        }
      } catch (err) {
        this.stop();
        throw new Error(`Error in ${this.name()} ${err}`);
      } finally {
        await Bluebird.Promise.delay(INTERVAL_MONITOR);
      }
    }
  }

  // eslint-disable-next-line
  public async handleEvents(): Promise<any> {}

  // eslint-disable-next-line
  public async handleBlock(): Promise<void> {}

  // eslint-disable-next-line
  public name(): string {
    return '';
  }
}
