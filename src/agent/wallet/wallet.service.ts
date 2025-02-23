import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { WithdrawTokenDto } from './dto/withdraw-token.dto';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { SellDto } from './dto/sell.dto';
import { BuyDto } from './dto/buy.dto';
import { PriceService } from 'src/price/price.service';
import { CdpConnector } from './cdp-connector';
import { PortfolioManager } from './portfolio-manager';
import { RecordDepositDto } from './dto/record-deposit.dto';

@Injectable()
export class WalletService implements OnModuleInit {

  private cdpConnector: CdpConnector;
  private portfolioManager: PortfolioManager;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private priceService: PriceService,
  ) {}

  onModuleInit() {
    this.cdpConnector = new CdpConnector(this.db, this.priceService);
    this.portfolioManager = new PortfolioManager(this.db);
  }

  async createAgentWallet(chainIdHex: string) {
    return this.cdpConnector.createAgentWallet(chainIdHex);
  }

  async getBalance(agentId: string) {
    return this.cdpConnector.getBalance(agentId);
  }

  async findByAgentId(agentId: string) {
    const result = await this.db.query.walletKeysTable.findFirst({
      where: eq(schema.walletKeysTable.agentId, +agentId),
    });
    return result;
  }

  async findAgentById(agentId: string) {
    const result = await this.db.query.agentsTable.findFirst({
      where: eq(schema.agentsTable.id, +agentId),
    });
    return result;
  }

  async recordDeposit(agentId: string, recordDepositDto: RecordDepositDto) {
    // return this.cdpConnector.recordDeposit(agentId, recordDepositDto);
  }

  async withdraw(agentId: string, withdrawTokenDto: WithdrawTokenDto) {
    return this.cdpConnector.withdraw(agentId, withdrawTokenDto);
  }

  async buyAsset(agentId: string, buyDto: BuyDto) {
    return this.cdpConnector.buyAsset(agentId, buyDto);
  }

  async sellAsset(agentId: string, sellDto: SellDto) {
    return this.cdpConnector.sellAsset(agentId, sellDto);
  }

  async faucet(agentId: string, token: string) {
    return this.cdpConnector.faucet(agentId, token);
  }

}
