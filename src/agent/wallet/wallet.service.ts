import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
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
import { EthConnector } from './eth-connector';
import { config } from 'src/config';
import { NATIVE_TOKEN_ADDRESS } from 'src/constant/eth.constant';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class WalletService implements OnModuleInit {

  private cdpConnector: CdpConnector;
  private portfolioManager: PortfolioManager;
  private ethConnector: EthConnector;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private priceService: PriceService,
    private tokenService: TokenService,
  ) {}

  onModuleInit() {
    this.cdpConnector = new CdpConnector(this.db, this.priceService);
    this.portfolioManager = new PortfolioManager(this.db);
    this.ethConnector = new EthConnector();
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
    try {
      const agent = await this.findAgentById(agentId);
      const walletInfo = await this.cdpConnector.getCoinbaseWallet(agentId);
      const history = await this.ethConnector.getTransferHistory(config.baseRpcUrl, recordDepositDto.transactionHash);

      const walletAddress = await walletInfo.getDefaultAddress().then(res => res.getId());
      if (history.toAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException(`Deposit destination address does not match agent wallet`);
      }

      const isNative = history.tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;
      const amount = isNative ? history.value : history.amount;

      const existingDeposit = await this.portfolioManager.findExistingDeposit(agentId, recordDepositDto.transactionHash);
      if (existingDeposit) {
        throw new BadRequestException(`Deposit already exists`);
      }

      const tokenMap = await this.tokenService.getAvailableTokenMap(agent.chainId);
      const tokenInfo = tokenMap[history.tokenAddress.toLowerCase()];

      let formattedAmount = Number(amount) / 10 ** tokenInfo.decimals;

      if (isNative) {
        const priceResults = await this.priceService.getPrices([history.tokenAddress], agent.chainId);
        const price = priceResults.find(price => price.token === tokenMap[NATIVE_TOKEN_ADDRESS].symbol.toUpperCase());
        formattedAmount = price.price * Number(amount);
      }

      const depositDate = new Date(history.timestamp);

      const recalculate = true;
      const deposit = await this.portfolioManager.createBalanceSnapshot(agentId, formattedAmount, formattedAmount, depositDate, recalculate);
      return deposit;
    } catch (e) {
      throw new BadRequestException(`Failed to record deposit: ${e.message}`);
    }
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
