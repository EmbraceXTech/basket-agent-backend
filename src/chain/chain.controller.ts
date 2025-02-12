import { Controller, Get, Param } from '@nestjs/common';
import { ChainService } from './chain.service';

@Controller('chain')
export class ChainController {
  constructor(private readonly chainService: ChainService) {}

  @Get('/available')
  async getAvailableChains() {
    return this.chainService.getAvailableChains();
  }

  @Get('/info/:chainId')
  async getChainInfo(@Param('chainId') chainId: number) {
    return this.chainService.getChainInfo(chainId);
  }

}
