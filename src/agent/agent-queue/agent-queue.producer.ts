import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  AGENT_EXECUTE_QUEUE,
  AGENT_END_DT_QUEUE,
  AGENT_SL_TP_QUEUE,
  AGENT_SL_TP_INTERVAL,
} from 'src/constant/queue.constant';

@Injectable()
export class AgentQueueProducer implements OnModuleInit {
  constructor(
    @InjectQueue(AGENT_SL_TP_QUEUE)
    private readonly agentSlTpQueue: Queue,
    @InjectQueue(AGENT_EXECUTE_QUEUE)
    private readonly agentExecuteQueue: Queue,
    @InjectQueue(AGENT_END_DT_QUEUE)
    private readonly agentEndDtQueue: Queue,
  ) {}

  async onModuleInit() {
    const jobs = await this.agentSlTpQueue.getJobSchedulers();
    const job = jobs.find((job) => job.name === AGENT_SL_TP_QUEUE);
    if (!job) {
      await this.agentSlTpQueue.add(
        AGENT_SL_TP_QUEUE,
        {},
        {
          repeat: {
            every: AGENT_SL_TP_INTERVAL,
          },
        },
      );
    }
  }

  async addAgentExecuteJob(agentId: string, intervalSeconds: number) {
    await this.agentExecuteQueue.add(
      agentId,
      {
        agentId,
      },
      {
        repeat: {
          every: intervalSeconds * 1000,
        },
      },
    );
  }

  async removeAgentExecuteJob(agentId: string) {
    const jobs = await this.agentExecuteQueue.getJobSchedulers();
    const job = jobs.find((job) => job.name === agentId);
    if (job) {
      await this.agentExecuteQueue.removeJobScheduler(job.key);
    }
  }

  async addAgentEndDtJob(agentId: string, endDate: Date) {
    const endDateTimestamp = endDate.getTime();
    const timeDiff = endDateTimestamp - Date.now();
    await this.agentEndDtQueue.add(
      agentId,
      {
        agentId,
      },
      {
        delay: timeDiff,
      },
    );
  }

  async removeAgentEndDtJob(agentId: string) {
    const jobs = await this.agentEndDtQueue.getDelayed();
    const job = jobs.find((job) => job.name === agentId);
    if (job) {
      await this.agentEndDtQueue.remove(job.id);
    }
  }

  async updateAgentExecuteJob(agentId: string, intervalSeconds: number) {
    await this.removeAgentExecuteJob(agentId);
    await this.addAgentExecuteJob(agentId, intervalSeconds);
  }

  async updateAgentEndDtJob(agentId: string, endDate: Date) {
    await this.removeAgentEndDtJob(agentId);
    await this.addAgentEndDtJob(agentId, endDate);
  }
}
