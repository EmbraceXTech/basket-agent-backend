import { Controller, Get } from '@nestjs/common';
import { LlmService } from './llm.service';

@Controller('llm')
export class LlmController {
  constructor(private readonly llmService: LlmService) {}

  @Get('create-trade-plan')
  createTradePlan() {
    return this.llmService.createTradePlan('3');
  }
}
