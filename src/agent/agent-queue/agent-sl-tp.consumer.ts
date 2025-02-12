import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AGENT_SL_TP_QUEUE } from 'src/constant/queue.constant';

@Processor(AGENT_SL_TP_QUEUE)
export class AgentSLTPConsumer extends WorkerHost {
  async process(job: Job) {
    console.log('AGENT_SL_TP_QUEUE triggered !');
  }
}
