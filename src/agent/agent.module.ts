import { forwardRef, Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { WalletModule } from './wallet/wallet.module';
import { PriceModule } from 'src/price/price.module';
import { BullModule } from '@nestjs/bullmq';
import {
  AGENT_EXECUTE_QUEUE,
  AGENT_END_DT_QUEUE,
  AGENT_SL_TP_QUEUE,
  AGENT_SNAPSHOT_QUEUE,
} from 'src/constant/queue.constant';
import { AgentQueueProducer } from './agent-queue/agent-queue.producer';
import { AgentExecuteConsumer } from './agent-queue/agent-execute.consumer';
import { AgentEndDtConsumer } from './agent-queue/agent-end-dt.consumer';
import { AgentSLTPConsumer } from './agent-queue/agent-sl-tp.consumer';
import { AgentSnapshotConsumer } from './agent-queue/agent-snapshot.consumer';
import { config } from 'src/config';
import { LlmModule } from 'src/llm/llm.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

@Module({
  imports: [
    PriceModule,
    forwardRef(() => LlmModule),
    forwardRef(() => WalletModule),
    BullModule.registerQueue({
      name: AGENT_EXECUTE_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: AGENT_EXECUTE_QUEUE,
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: AGENT_END_DT_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: AGENT_END_DT_QUEUE,
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: AGENT_SL_TP_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: AGENT_SL_TP_QUEUE,
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: AGENT_SNAPSHOT_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: AGENT_SNAPSHOT_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentQueueProducer,
    ...(config.nodeEnv === 'production'
      ? [
          AgentExecuteConsumer,
          AgentEndDtConsumer,
          AgentSLTPConsumer,
          AgentSnapshotConsumer,
        ]
      : []),
  ],
  exports: [AgentService],
})
export class AgentModule {}
