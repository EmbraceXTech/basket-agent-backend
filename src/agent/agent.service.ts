import { Inject, Injectable } from '@nestjs/common';
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
import { WithdrawTokenDto } from './dto/withdraw-token.dto';
import { and, eq } from 'drizzle-orm';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class AgentService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
  ) {}

  async findAll(userId: string) {
    const agents = await this.db.query.agentsTable.findMany({
      where: eq(schema.agentsTable.userId, +userId),
    });
    return agents;
  }

  async create(userId: string, createAgentDto: CreateAgentDto) {
    const transaction = await this.db.transaction(async (tx) => {
      const agent = await tx
        .insert(schema.agentsTable)
        .values({
          ...createAgentDto,
          userId: +userId,
          selectedTokens: createAgentDto.selectedTokens.map((token) =>
            JSON.stringify(token),
          ),
        } as typeof schema.agentsTable.$inferInsert)
        .returning();

      const agentWallet = await this.walletService.createAgentWallet();

      await tx.insert(schema.walletKeysTable).values({
        address: agentWallet.address,
        ivString: agentWallet.ivString,
        encryptedWalletData: agentWallet.encryptedWalletData,
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
  }

  async findOne(id: string) {
    const agent = await this.db.query.agentsTable.findFirst({
      where: eq(schema.agentsTable.id, +id),
      with: {
        knowledge: true,
        log: true,
        walletKey: {
          columns: {
            address: true,
          },
        },
      },
    });
    return agent;
  }

  async getLogs(id: string) {
    const logs = await this.db.query.logsTable.findMany({
      where: eq(schema.logsTable.agentId, +id),
    });
    return logs;
  }

  async updateStrategy(id: string, updateStrategyDto: UpdateStrategyDto) {
    const agent = await this.db
      .update(schema.agentsTable)
      .set({
        strategy: updateStrategyDto.strategy,
      })
      .where(eq(schema.agentsTable.id, +id));
    return agent;
  }

  async addKnowledge(id: string, addKnowledgeDto: AddKnowledgeDto) {
    const knowledge = await this.db.insert(schema.knowledgesTable).values({
      ...addKnowledgeDto,
      agentId: +id,
    });
    return knowledge;
  }

  async deleteKnowledge(id: string, knowledgeId: string) {
    const knowledge = await this.db
      .delete(schema.knowledgesTable)
      .where(
        and(
          eq(schema.knowledgesTable.id, +knowledgeId),
          eq(schema.knowledgesTable.agentId, +id),
        ),
      );
    return knowledge;
  }

  async updateInterval(id: string, updateIntervalDto: UpdateIntervalDto) {
    const agent = await this.db
      .update(schema.agentsTable)
      .set({
        ...updateIntervalDto,
      })
      .where(eq(schema.agentsTable.id, +id));
    return agent;
  }

  async updateEndDate(id: string, updateEndDateDto: UpdateEndDateDto) {
    // TODO: Implement updateEndDate logic
    return {
      id,
      updateEndDateDto,
    };
  }

  async updateStopLoss(id: string, updateStopLossDto: UpdateStopLossDto) {
    // TODO: Implement updateStopLoss logic
    return {
      id,
      updateStopLossDto,
    };
  }

  async updateTakeProfit(id: string, updateTakeProfitDto: UpdateTakeProfitDto) {
    // TODO: Implement updateTakeProfit logic
    return {
      id,
      updateTakeProfitDto,
    };
  }

  async start(id: string) {
    // TODO: Implement start logic
    return {
      id,
    };
  }

  async pause(id: string) {
    // TODO: Implement pause logic
    return {
      id,
    };
  }

  async stop(id: string) {
    // TODO: Implement stop logic
    return {
      id,
    };
  }

  async updateTokens(id: string, updateTokensDto: UpdateTokensDto) {
    // TODO: Implement updateTokens logic
    return {
      id,
      updateTokensDto,
    };
  }

  async withdraw(id: string, withdrawTokenDto: WithdrawTokenDto) {
    // TODO: Implement withdraw logic
    return {
      id,
      withdrawTokenDto,
    };
  }
}
