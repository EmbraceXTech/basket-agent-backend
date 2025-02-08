import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  findAll() {
    return this.agentService.findAll();
  }

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentService.create(createAgentDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentService.findOne(id);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string) {
    return this.agentService.getLogs(id);
  }

  @Patch(':id/strategy')
  updateStrategy(
    @Param('id') id: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ) {
    return this.agentService.updateStrategy(id, updateStrategyDto);
  }

  @Post(':id/knowledge')
  addKnowledge(
    @Param('id') id: string,
    @Body() addKnowledgeDto: AddKnowledgeDto,
  ) {
    return this.agentService.addKnowledge(id, addKnowledgeDto);
  }

  @Delete(':id/knowledge/:knowledgeId')
  deleteKnowledge(
    @Param('id') id: string,
    @Param('knowledgeId') knowledgeId: string,
  ) {
    return this.agentService.deleteKnowledge(id, knowledgeId);
  }

  @Patch(':id/interval')
  updateInterval(
    @Param('id') id: string,
    @Body() updateIntervalDto: UpdateIntervalDto,
  ) {
    return this.agentService.updateInterval(id, updateIntervalDto);
  }

  @Patch(':id/end-date')
  updateEndDate(
    @Param('id') id: string,
    @Body() updateEndDateDto: UpdateEndDateDto,
  ) {
    return this.agentService.updateEndDate(id, updateEndDateDto);
  }

  @Patch(':id/stop-loss')
  updateStopLoss(
    @Param('id') id: string,
    @Body() updateStopLossDto: UpdateStopLossDto,
  ) {
    return this.agentService.updateStopLoss(id, updateStopLossDto);
  }

  @Patch(':id/take-profit')
  updateTakeProfit(
    @Param('id') id: string,
    @Body() updateTakeProfitDto: UpdateTakeProfitDto,
  ) {
    return this.agentService.updateTakeProfit(id, updateTakeProfitDto);
  }

  @Patch(':id/start')
  start(@Param('id') id: string) {
    return this.agentService.start(id);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.agentService.pause(id);
  }

  @Patch(':id/stop')
  stop(@Param('id') id: string) {
    return this.agentService.stop(id);
  }

  @Patch(':id/tokens')
  updateTokens(
    @Param('id') id: string,
    @Body() updateTokensDto: UpdateTokensDto,
  ) {
    return this.agentService.updateTokens(id, updateTokensDto);
  }
}
