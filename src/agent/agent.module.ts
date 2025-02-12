import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { WalletModule } from './wallet/wallet.module';
import { PriceModule } from 'src/price/price.module';
import { BullModule } from '@nestjs/bullmq';
import {
  AGENT_EXECUTE_QUEUE,
  AGENT_END_DT_QUEUE,
  AGENT_SL_TP_QUEUE,
} from 'src/constant/queue.constant';
import { AgentQueueProducer } from './agent-queue/agent-queue.producer';
import { AgentExecuteConsumer } from './agent-queue/agent-execute.consumer';
import { AgentEndDtConsumer } from './agent-queue/agent-end-dt.consumer';
import { AgentSLTPConsumer } from './agent-queue/agent-sl-tp.consumer';

@Module({
  imports: [
    WalletModule,
    PriceModule,
    BullModule.registerQueue({
      name: AGENT_EXECUTE_QUEUE,
    }),
    BullModule.registerQueue({
      name: AGENT_END_DT_QUEUE,
    }),
    BullModule.registerQueue({
      name: AGENT_SL_TP_QUEUE,
    }),
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentQueueProducer,
    AgentExecuteConsumer,
    AgentEndDtConsumer,
    AgentSLTPConsumer,
  ],
})
export class AgentModule {}
