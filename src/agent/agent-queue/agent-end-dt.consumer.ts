import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AGENT_END_DT_QUEUE } from 'src/constant/queue.constant';

@Processor(AGENT_END_DT_QUEUE)
export class AgentEndDtConsumer extends WorkerHost {
  async process(job: Job<{ agentId: string }>) {
    const { agentId } = job.data;
    console.log('agentId', agentId, 'AGENT_END_DT_QUEUE triggered !');
  }
}
