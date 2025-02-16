import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { UpdateEndDateDto } from './dto/update-end-date.dto';
import { UpdateStopLossDto } from './dto/update-stop-loss.dto';
import { UpdateTakeProfitDto } from './dto/update-take-profit.dto';
import { UpdateTokensDto } from './dto/update-tokens.dto';
import { AddKnowledgeDto } from './dto/add-knowledge.dto';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { WithdrawTokenDto } from './wallet/dto/withdraw-token.dto';
import { and, eq } from 'drizzle-orm';
import { WalletService } from './wallet/wallet.service';
import {
  // COINBASE_CHAIN_ID_HEX_MAP,
  COINBASE_NETWORK_ID_MAP,
  DEFAULT_CHAIN_ID,
} from './wallet/constants/coinbase-chain.const';
import { AgentQueueProducer } from './agent-queue/agent-queue.producer';

@Injectable()
export class AgentService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
    private readonly agentQueueProducer: AgentQueueProducer,
  ) {}

  async findAll(userId: string) {
    try {
      const agents = await this.db.query.agentsTable.findMany({
        where: eq(schema.agentsTable.userId, +userId),
      });
      return agents;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agents: ${error.message}`);
    }
  }

  async create(userId: string, createAgentDto: CreateAgentDto) {
    try {
      const chainInfo =
        COINBASE_NETWORK_ID_MAP[createAgentDto.chainId] || DEFAULT_CHAIN_ID;

      const transaction = await this.db.transaction(async (tx) => {
        const agent = await tx
          .insert(schema.agentsTable)
          .values({
            ...createAgentDto,
            userId: +userId,
            selectedTokens: createAgentDto.selectedTokens.map((token) =>
              JSON.stringify(token),
            ),
            endDate: createAgentDto.endDate
              ? new Date(createAgentDto.endDate)
              : null,
            chainId: chainInfo.chainId,
          } as typeof schema.agentsTable.$inferInsert)
          .returning();

        const agentWallet = await this.walletService.createAgentWallet(
          chainInfo.chainId,
        );

        await tx.insert(schema.walletKeysTable).values({
          ...agentWallet,
          agentId: agent[0].id,
        });

        if (createAgentDto.knowledges.length > 0) {
          await tx.insert(schema.knowledgesTable).values(
            createAgentDto.knowledges.map((knowledge) => ({
              ...knowledge,
              agentId: agent[0].id,
            })),
          );
        }

        return agent;
      });
      return transaction;
    } catch (error) {
      throw new BadRequestException(`Failed to create agent: ${error.message}`);
    }
  }

  async findOne(id: string) {
    try {
      const agent = await this.db.query.agentsTable.findFirst({
        where: eq(schema.agentsTable.id, +id),
        with: {
          knowledge: true,
          walletKey: {
            columns: {
              address: true,
            },
          },
        },
      });
      if (!agent) {
        throw new BadRequestException(`Agent with id ${id} not found`);
      }
      return agent;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch agent: ${error.message}`);
    }
  }

  async getLogs(id: string) {
    try {
      const logs = await this.db.query.logsTable.findMany({
        where: eq(schema.logsTable.agentId, +id),
      });
      return logs;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch agent logs: ${error.message}`,
      );
    }
  }

  async updateStrategy(id: string, updateStrategyDto: UpdateStrategyDto) {
    try {
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          strategy: updateStrategyDto.strategy,
        })
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update strategy: ${error.message}`,
      );
    }
  }

  async addKnowledge(id: string, addKnowledgeDto: AddKnowledgeDto) {
    try {
      const knowledge = await this.db.insert(schema.knowledgesTable).values({
        ...addKnowledgeDto,
        agentId: +id,
      });
      return knowledge;
    } catch (error) {
      throw new BadRequestException(
        `Failed to add knowledge: ${error.message}`,
      );
    }
  }

  async deleteKnowledge(id: string, knowledgeId: string) {
    try {
      const knowledge = await this.db
        .delete(schema.knowledgesTable)
        .where(
          and(
            eq(schema.knowledgesTable.id, +knowledgeId),
            eq(schema.knowledgesTable.agentId, +id),
          ),
        )
        .execute();
      return knowledge;
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete knowledge: ${error.message}`,
      );
    }
  }

  async updateStopLoss(id: string, updateStopLossDto: UpdateStopLossDto) {
    try {
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          stopLossUSD: updateStopLossDto.stopLossUSD,
        } as Partial<typeof schema.agentsTable.$inferInsert>)
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update stop loss: ${error.message}`,
      );
    }
  }

  async updateTakeProfit(id: string, updateTakeProfitDto: UpdateTakeProfitDto) {
    try {
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          takeProfitUSD: updateTakeProfitDto.takeProfitUSD,
        } as Partial<typeof schema.agentsTable.$inferInsert>)
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update take profit: ${error.message}`,
      );
    }
  }

  async start(id: string) {
    try {
      const currentAgent = await this.findOne(id);
      if (currentAgent.isRunning) {
        throw new BadRequestException('Agent is already running');
      }
      if (currentAgent.endDate) {
        if (currentAgent.endDate < new Date()) {
          throw new BadRequestException('Agent end date is in the past');
        }
        await this.agentQueueProducer.addAgentEndDtJob(
          id,
          currentAgent.endDate,
        );
      }
      await this.agentQueueProducer.addAgentExecuteJob(
        id,
        currentAgent.intervalSeconds,
      );
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          isRunning: true,
        } as Partial<typeof schema.agentsTable.$inferInsert>)
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(`Failed to start agent: ${error.message}`);
    }
  }

  async pause(id: string) {
    try {
      const currentAgent = await this.findOne(id);
      if (!currentAgent.isRunning) {
        throw new BadRequestException('Agent is not running');
      }
      await this.agentQueueProducer.removeAgentExecuteJob(id);
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          isRunning: false,
        } as Partial<typeof schema.agentsTable.$inferInsert>)
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(`Failed to pause agent: ${error.message}`);
    }
  }

  async stop(id: string) {
    try {
      await this.agentQueueProducer.removeAgentExecuteJob(id);
      await this.agentQueueProducer.removeAgentEndDtJob(id);
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          isRunning: false,
        } as Partial<typeof schema.agentsTable.$inferInsert>)
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(`Failed to stop agent: ${error.message}`);
    }
  }

  async updateInterval(id: string, updateIntervalDto: UpdateIntervalDto) {
    try {
      const currentAgent = await this.findOne(id);
      if (currentAgent.isRunning) {
        await this.agentQueueProducer.updateAgentExecuteJob(
          id,
          updateIntervalDto.intervalSeconds,
        );
      }
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          ...updateIntervalDto,
        })
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update interval: ${error.message}`,
      );
    }
  }

  async updateEndDate(id: string, updateEndDateDto: UpdateEndDateDto) {
    try {
      const currentAgent = await this.findOne(id);
      if (currentAgent.isRunning) {
        await this.agentQueueProducer.updateAgentEndDtJob(
          id,
          updateEndDateDto.endDate,
        );
      }
      const agent = await this.db
        .update(schema.agentsTable)
        .set({
          endDate: updateEndDateDto.endDate,
        } as Partial<typeof schema.agentsTable.$inferInsert>)
        .where(eq(schema.agentsTable.id, +id))
        .execute();
      return agent;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update end date: ${error.message}`,
      );
    }
  }

  async updateTokens(id: string, updateTokensDto: UpdateTokensDto) {
    try {
      // TODO: Implement updateTokens logic
      return {
        id,
        updateTokensDto,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update tokens: ${error.message}`,
      );
    }
  }

  async withdraw(id: string, withdrawTokenDto: WithdrawTokenDto) {
    try {
      // TODO: Implement withdraw logic
      return {
        id,
        withdrawTokenDto,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to withdraw tokens: ${error.message}`,
      );
    }
  }
}
