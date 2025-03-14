import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { WithdrawTokenDto } from './dto/withdraw-token.dto';
import { DrizzleAsyncProvider } from 'src/db/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from 'src/db/schema';
import { eq } from 'drizzle-orm';
import { SellDto } from './dto/sell.dto';
import { BuyDto } from './dto/buy.dto';
import { PriceService } from 'src/price/price.service';
import { PortfolioManager } from './portfolio-manager';
import { RecordDepositDto } from './dto/record-deposit.dto';
import { EthConnector } from './eth-connector';
import { NATIVE_TOKEN_ADDRESS } from 'src/constant/eth.constant';
import { TokenService } from 'src/token/token.service';
import { BalanceSnapshotInput } from './interfaces/balance-snapshot.interface';
import { ParaConnector } from './para-connector';
import { AgentService } from '../agent.service';
import ClaimPregensDto from './dto/claim.dto';
import { ChainService } from 'src/chain/chain.service';

@Injectable()
export class WalletService implements OnModuleInit {
  private paraConnector: ParaConnector;
  private portfolioManager: PortfolioManager;
  private ethConnector: EthConnector;

  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly priceService: PriceService,
    private readonly tokenService: TokenService,
    @Inject(forwardRef(() => AgentService))
    private readonly agentService: AgentService,
    private readonly chainService: ChainService,
  ) {}

  onModuleInit() {
    this.ethConnector = new EthConnector(this.tokenService, this.chainService);
    this.paraConnector = new ParaConnector(
      this.db,
      this.priceService,
      this.tokenService,
      this.agentService,
      this.chainService,
      this.ethConnector
    );
    this.portfolioManager = new PortfolioManager(this.db);
  }

  async createAgentWallet(chainId: string) {
    // return this.cdpConnector.createAgentWallet(chainIdHex);
    return this.paraConnector.createAgentWallet(chainId);
  }

  async getBalance(agentId: string) {
    // const walletBalance = await this.cdpConnector.getBalance(agentId);
    const walletBalance = await this.paraConnector.getBalance(agentId);
    const balanceSnapshot =
      await this.portfolioManager.getLastSnapshot(agentId);
    return {
      ...walletBalance,
      equity: balanceSnapshot ? balanceSnapshot.equity : 0,
      performance: balanceSnapshot ? balanceSnapshot.performance : 0,
    };
  }

  async getBalanceChart(agentId: string) {
    return this.portfolioManager.getBalanceSnapshotTimeSeries(agentId);
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
      const balanceInfo = await this.getBalance(agentId);
      const chainInfo = await this.chainService.getChainInfo(
        Number(agent.chainId),
      );
      const [rpcUrl] = chainInfo.rpc;
      const history = await this.ethConnector.getTransferHistory(
        rpcUrl,
        recordDepositDto.transactionHash,
      );

      const walletAddress = await this.paraConnector.getWalletAddress(agentId);
      if (history.toAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new BadRequestException(
          `Deposit destination address does not match agent wallet`,
        );
      }

      const isNative =
        history.tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS;
      const amount = isNative ? history.value : history.amount;

      const existingDeposit = await this.portfolioManager.findExistingDeposit(
        agentId,
        recordDepositDto.transactionHash,
      );
      if (existingDeposit) {
        throw new BadRequestException(`Deposit already exists`);
      }

      const tokenMap = await this.tokenService.getAvailableTokenMap(
        agent.chainId,
      );
      const tokenInfo = tokenMap[history.tokenAddress.toLowerCase()];

      let formattedAmount = Number(amount) / 10 ** tokenInfo.decimals;

      if (isNative) {
        const priceResults = await this.priceService.getPrices(
          ['ETH'],
          agent.chainId,
        );
        const price = priceResults.find((price) => price.token === 'ETH');
        formattedAmount = (price.price * Number(amount)) / 10 ** 18;
      }

      const depositDate = new Date(history.timestamp);

      const recalculate = true;
      const data: BalanceSnapshotInput = {
        balance: balanceInfo.balance,
        injection: formattedAmount,
        date: depositDate,
        transactionHash: recordDepositDto.transactionHash,
      };
      const deposit = await this.portfolioManager.createBalanceSnapshot(
        agentId,
        data,
        recalculate,
      );

      // Log successful deposit
      await this.db.insert(schema.logsTable).values({
        agentId: +agentId,
        logType: 'DEPOSIT',
        content: JSON.stringify({
          event: 'DEPOSIT_COMPLETED',
          timestamp: new Date().toISOString(),
          metadata: {
            transactionHash: recordDepositDto.transactionHash,
            amount: formattedAmount,
            token: isNative ? 'ETH' : tokenInfo.symbol,
            depositDate: depositDate.toISOString(),
            walletAddress,
          },
          result: deposit,
        }),
      });

      return deposit;
    } catch (e) {
      console.error(e);
      throw new BadRequestException(`Failed to record deposit: ${e.message}`);
    }
  }

  async withdraw(agentId: string, withdrawTokenDto: WithdrawTokenDto) {
    try {
      const result = await this.paraConnector.withdraw(
        agentId,
        withdrawTokenDto,
      );
      const transactionHash = result;

      const agent = await this.findAgentById(agentId);
      const balanceInfo = await this.getBalance(agentId);

      const isNative = withdrawTokenDto.assetId === 'eth';
      const amount = isNative
        ? withdrawTokenDto.amount
        : withdrawTokenDto.amount * 10 ** 6;

      let formattedAmount = Number(amount) / 10 ** 6; // USDC decimals

      if (isNative) {
        const priceResults = await this.priceService.getPrices(
          ['ETH'],
          agent.chainId,
        );
        const price = priceResults.find((price) => price.token === 'ETH');
        formattedAmount = price.price * Number(amount);
      }

      const data: BalanceSnapshotInput = {
        balance: balanceInfo.balance,
        injection: -formattedAmount,
        date: new Date(),
        transactionHash,
      };
      const withdrawal = await this.portfolioManager.createBalanceSnapshot(
        agentId,
        data,
      );

      // Log successful withdrawal
      await this.db.insert(schema.logsTable).values({
        agentId: +agentId,
        logType: 'WITHDRAWAL',
        content: JSON.stringify({
          event: 'WITHDRAWAL_COMPLETED',
          timestamp: new Date().toISOString(),
          metadata: {
            transactionHash,
            amount: formattedAmount,
            token: isNative ? 'ETH' : 'USDC',
            recipientAddress: withdrawTokenDto.recipientAddress,
          },
          result: withdrawal,
        }),
      });

      return { transactionHash };
    } catch (e) {
      console.error(e);
      throw new BadRequestException(`Failed to withdraw: ${e.message}`);
    }
  }

  async recordBalanceSnapshot(agentId: string) {
    try {
      const balanceInfo = await this.getBalance(agentId);
      const data: BalanceSnapshotInput = {
        balance: balanceInfo.balance,
        injection: 0,
        date: new Date(),
      };
      return await this.portfolioManager.createBalanceSnapshot(agentId, data);
    } catch (e) {
      throw new BadRequestException(
        `Failed to record balance snapshot: ${e.message}`,
      );
    }
  }

  // TODO: handle when para connector is ready
  async buyAsset(agentId: string, buyDto: BuyDto) {
    // return this.cdpConnector.buyAsset(agentId, buyDto);
    return this.paraConnector.buyAsset(agentId, buyDto);
  }

  // TODO: handle when para connector is ready
  async sellAsset(agentId: string, sellDto: SellDto) {
    // return this.cdpConnector.sellAsset(agentId, sellDto);
    return this.paraConnector.sellAsset(agentId, sellDto);
  }

  async faucet(agentId: string, token: string) {
    // return this.cdpConnector.faucet(agentId, token);
    return this.paraConnector.faucet(agentId, token);
  }

  async claimPregenWallet(agentId: string, claimPregensDto: ClaimPregensDto) {
    await this.paraConnector.claimPregenWallet(agentId, claimPregensDto);
  }
}
