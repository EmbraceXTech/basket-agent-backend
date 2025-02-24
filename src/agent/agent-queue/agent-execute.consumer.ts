import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AGENT_EXECUTE_QUEUE } from 'src/constant/queue.constant';
import { AgentService } from '../agent.service';
import { Inject } from '@nestjs/common';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';

@Processor(AGENT_EXECUTE_QUEUE)
export class AgentExecuteConsumer extends WorkerHost {
  constructor(
    private readonly agentService: AgentService,
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {
    super();
  }

  async process(job: Job<{ agentId: string }>) {
    const { agentId } = job.data;
    try {
      await this.agentService.operateTrade(agentId);
      console.log('agentId', agentId, 'AGENT_EXECUTE_QUEUE triggered !');
    } catch (error) {
      console.log('agentId', agentId, 'AGENT_EXECUTE_QUEUE failed !');
      console.error(error);
    }
  }
}
