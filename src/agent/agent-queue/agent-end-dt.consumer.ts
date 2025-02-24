import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AGENT_END_DT_QUEUE } from 'src/constant/queue.constant';
import { AgentService } from '../agent.service';

@Processor(AGENT_END_DT_QUEUE)
export class AgentEndDtConsumer extends WorkerHost {
  constructor(private readonly agentService: AgentService) {
    super();
  }

  async process(job: Job<{ agentId: string }>) {
    const { agentId } = job.data;
    try {
      await this.agentService.stop(agentId);
      console.log('agentId', agentId, 'AGENT_END_DT_QUEUE triggered !');
    } catch (error) {
      console.log('agentId', agentId, 'AGENT_END_DT_QUEUE failed !');
      console.error(error);
    }
  }
}
