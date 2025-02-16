import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AGENT_EXECUTE_QUEUE } from 'src/constant/queue.constant';

@Processor(AGENT_EXECUTE_QUEUE)
export class AgentExecuteConsumer extends WorkerHost {
  async process(job: Job<{ agentId: string }>) {
    const { agentId } = job.data;
    console.log('agentId', agentId, 'AGENT_EXECUTE_QUEUE triggered !');
  }
}
