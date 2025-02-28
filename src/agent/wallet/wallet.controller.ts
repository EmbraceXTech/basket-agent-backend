import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ValidateAgentOwner } from 'src/common/decorators/validate-agent-owner.decorator';
import { AgentGuard } from 'src/common/guards/agent.guard';
import { WalletService } from './wallet.service';
import { WithdrawTokenDto } from './dto/withdraw-token.dto';
import { BuyDto } from './dto/buy.dto';
import { SellDto } from './dto/sell.dto';
import { FaucetDto } from './dto/faucet.dto';
import { RecordDepositDto } from './dto/record-deposit.dto';
import ClaimPregensDto from './dto/claim.dto';

@Controller('agent/:agentId/wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(AgentGuard)
  @Get('balance')
  getBalance(@ValidateAgentOwner() agentId: string) {
    return this.walletService.getBalance(agentId);
  }

  @UseGuards(AgentGuard)
  @Get('balance-chart')
  getBalanceChart(@ValidateAgentOwner() agentId: string) {
    return this.walletService.getBalanceChart(agentId);
  }

  @UseGuards(AgentGuard)
  @Post('record-deposit')
  recordDeposit(
    @ValidateAgentOwner() agentId: string,
    @Body() recordDepositDto: RecordDepositDto,
  ) {
    return this.walletService.recordDeposit(agentId, recordDepositDto);
  }

  @UseGuards(AgentGuard)
  @Post('withdraw')
  withdraw(
    @ValidateAgentOwner() agentId: string,
    @Body() withdrawTokenDto: WithdrawTokenDto,
  ) {
    return this.walletService.withdraw(agentId, withdrawTokenDto);
  }

  @UseGuards(AgentGuard)
  @Post('balance-snapshot')
  createBalanceSnapshot(@ValidateAgentOwner() agentId: string) {
    return this.walletService.recordBalanceSnapshot(agentId);
  }

  @UseGuards(AgentGuard)
  @Post('buy-asset')
  buyAsset(@ValidateAgentOwner() agentId: string, @Body() buyDto: BuyDto) {
    return this.walletService.buyAsset(agentId, buyDto);
  }

  @UseGuards(AgentGuard)
  @Post('sell-asset')
  sellAsset(@ValidateAgentOwner() agentId: string, @Body() sellDto: SellDto) {
    return this.walletService.sellAsset(agentId, sellDto);
  }

  @UseGuards(AgentGuard)
  @Post('claim-pregen-wallet')
  claimPregens(
    @ValidateAgentOwner() agentId: string,
    @Body() claimPregensDto: ClaimPregensDto,
  ) {
    return this.walletService.claimPregenWallet(agentId, claimPregensDto);
  }

  @UseGuards(AgentGuard)
  @Post('faucet')
  faucet(
    @ValidateAgentOwner() agentId: string,
    @Body(ValidationPipe) faucetDto: FaucetDto,
  ) {
    try {
      return this.walletService.faucet(agentId, faucetDto.token);
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
