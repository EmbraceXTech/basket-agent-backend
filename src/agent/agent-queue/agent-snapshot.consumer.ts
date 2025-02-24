import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AGENT_SNAPSHOT_QUEUE } from 'src/constant/queue.constant';
import { WalletService } from '../wallet/wallet.service';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { Inject } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';

@Processor(AGENT_SNAPSHOT_QUEUE)
export class AgentSnapshotConsumer extends WorkerHost {
  constructor(
    private readonly walletService: WalletService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job) {
    const agents = await this.db.select().from(schema.agentsTable);
    for (const agent of agents) {
      try {
        await this.walletService.recordBalanceSnapshot(agent.id.toString());
        console.log(`Agent ${agent.id} balance snapshot recorded`);
      } catch (error) {
        console.log(`Agent ${agent.id} balance snapshot failed`);
        console.error(error);
      }
    }
  }
}
