import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';
import { UpdateIntervalDto } from './dto/update-interval.dto';
import { UpdateEndDateDto } from './dto/update-end-date.dto';
import { UpdateStopLossDto } from './dto/update-stop-loss.dto';
import { UpdateTakeProfitDto } from './dto/update-take-profit.dto';
import { UpdateTokensDto } from './dto/update-tokens.dto';
import { AddKnowledgeDto } from './dto/add-knowledge.dto';
import { WithdrawTokenDto } from './wallet/dto/withdraw-token.dto';
import { AgentGuard } from '../common/guards/agent.guard';
import { ValidateAgentOwner } from 'src/common/decorators/validate-agent-owner.decorator';
import { ValidateUser } from 'src/common/decorators/validate-user.decorator';
import { WalletService } from './wallet/wallet.service';
import { FaucetDto } from './wallet/dto/faucet.dto';
import { BuyDto } from './wallet/dto/buy.dto';
import { SellDto } from './wallet/dto/sell.dto';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly walletService: WalletService,
  ) {}

  @Get()
  findAll(@ValidateUser() userId: string) {
    return this.agentService.findAll(userId);
  }

  @Post()
  create(
    @ValidateUser() userId: string,
    @Body() createAgentDto: CreateAgentDto,
  ) {
    return this.agentService.create(userId, createAgentDto);
  }

  @UseGuards(AgentGuard)
  @Get(':agentId')
  findOne(@ValidateAgentOwner() agentId: string) {
    return this.agentService.findOne(agentId);
  }

  @UseGuards(AgentGuard)
  @Get(':agentId/logs')
  getLogs(@ValidateAgentOwner() agentId: string) {
    return this.agentService.getLogs(agentId);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/strategy')
  updateStrategy(
    @ValidateAgentOwner() agentId: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ) {
    return this.agentService.updateStrategy(agentId, updateStrategyDto);
  }

  @UseGuards(AgentGuard)
  @Post(':agentId/knowledge')
  addKnowledge(
    @ValidateAgentOwner() agentId: string,
    @Body() addKnowledgeDto: AddKnowledgeDto,
  ) {
    return this.agentService.addKnowledge(agentId, addKnowledgeDto);
  }

  @UseGuards(AgentGuard)
  @Delete(':agentId/knowledge/:knowledgeId')
  deleteKnowledge(
    @ValidateAgentOwner() agentId: string,
    @Param('knowledgeId') knowledgeId: string,
  ) {
    return this.agentService.deleteKnowledge(agentId, knowledgeId);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/interval')
  updateInterval(
    @ValidateAgentOwner() agentId: string,
    @Body() updateIntervalDto: UpdateIntervalDto,
  ) {
    return this.agentService.updateInterval(agentId, updateIntervalDto);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/end-date')
  updateEndDate(
    @ValidateAgentOwner() agentId: string,
    @Body() updateEndDateDto: UpdateEndDateDto,
  ) {
    return this.agentService.updateEndDate(agentId, updateEndDateDto);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/stop-loss')
  updateStopLoss(
    @ValidateAgentOwner() agentId: string,
    @Body() updateStopLossDto: UpdateStopLossDto,
  ) {
    return this.agentService.updateStopLoss(agentId, updateStopLossDto);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/take-profit')
  updateTakeProfit(
    @ValidateAgentOwner() agentId: string,
    @Body() updateTakeProfitDto: UpdateTakeProfitDto,
  ) {
    return this.agentService.updateTakeProfit(agentId, updateTakeProfitDto);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/start')
  start(@ValidateAgentOwner() agentId: string) {
    return this.agentService.start(agentId);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/pause')
  pause(@ValidateAgentOwner() agentId: string) {
    return this.agentService.pause(agentId);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/stop')
  stop(@ValidateAgentOwner() agentId: string) {
    return this.agentService.stop(agentId);
  }

  @UseGuards(AgentGuard)
  @Patch(':agentId/tokens')
  updateTokens(
    @ValidateAgentOwner() agentId: string,
    @Body() updateTokensDto: UpdateTokensDto,
  ) {
    return this.agentService.updateTokens(agentId, updateTokensDto);
  }

  @UseGuards(AgentGuard)
  @Get(':agentId/wallet/balance')
  getBalance(@ValidateAgentOwner() agentId: string) {
    return this.walletService.getBalance(agentId);
  }

  @UseGuards(AgentGuard)
  @Post(':agentId/wallet/withdraw')
  withdraw(
    @ValidateAgentOwner() agentId: string,
    @Body() withdrawTokenDto: WithdrawTokenDto,
  ) {
    return this.walletService.withdraw(agentId, withdrawTokenDto);
  }

  @UseGuards(AgentGuard)
  @Post(':agentId/wallet/buy-asset')
  buyAsset(@ValidateAgentOwner() agentId: string, @Body() buyDto: BuyDto) {
    return this.walletService.buyAsset(agentId, buyDto);
  }

  @UseGuards(AgentGuard)
  @Post(':agentId/wallet/sell-asset')
  sellAsset(@ValidateAgentOwner() agentId: string, @Body() sellDto: SellDto) {
    return this.walletService.sellAsset(agentId, sellDto);
  }

  @UseGuards(AgentGuard)
  @Post(':agentId/wallet/faucet')
  faucet(
    @ValidateAgentOwner() agentId: string,
    @Body(ValidationPipe) faucetDto: FaucetDto,
  ) {
    return this.walletService.faucet(agentId, faucetDto.token);
  }
}
