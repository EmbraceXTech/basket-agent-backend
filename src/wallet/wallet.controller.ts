import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateAgentWalletDto } from './dto/create-agent-wallet-dto.entity';
import { WithdrawAgentFundsDto } from './dto/withdraw-agent-funds-dto.entity';
import { TestFaucetDto } from './dto/test-faucet-dto.entity';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('agent-wallet/:agentId')
  async getAgentWallet(@Param('agentId') agentId: string) {
    const userId = '';
    // TODO: check agent ownership
    try {
      const wallet = await this.walletService.getAgentWallet(agentId);
      return {
        address: await wallet.getDefaultAddress().then((res) => res.getId()),
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('agent-wallet/:agentId/balance')
  async getAgentWalletBalance(@Param('agentId') agentId: string) {
    const userId = '';
    // TODO: check agent ownership
    try {
      const wallet = await this.walletService.getAgentWallet(agentId);
      const balances = await wallet.listBalances();
      return {
        balances: Array.from(balances),
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // @Post('create-agent-wallet')
  // async createAgentWallet(
  //   @Body(ValidationPipe) createAgentWalletDto: CreateAgentWalletDto,
  // ) {
  //   // Check agent ownership
  //   const userId = '';
  //   try {
  //     const result = await this.walletService.createAgentWallet(
  //       createAgentWalletDto.agentId,
  //     );
  //     return {
  //       address: result.address,
  //     };
  //   } catch (e) {
  //     throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }

  // TODO: check agent ownership
  @Post('withdraw-agent-funds')
  async withdrawAgentFunds(
    @Body(ValidationPipe) withdrawAgentFundsDto: WithdrawAgentFundsDto,
  ) {
    const userId = '';
    // TODO: check agent ownership
    try {
      const result = await this.walletService.transferFunds(
        withdrawAgentFundsDto.agentId,
        withdrawAgentFundsDto.recipientAddress,
        withdrawAgentFundsDto.amount,
      );
      return {
        transactionHash: result.getTransactionHash(),
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // TODO: trande spcefici taks

  @Post('test/faucet/:agentId')
  async testFaucet(@Body(ValidationPipe) testFaucetDto: TestFaucetDto) {
    // TODO: check agent ownership
    const userId = '';
    try {
      const wallet = await this.walletService.getAgentWallet(
        testFaucetDto.agentId,
      );
      const faucetTx = await wallet.faucet(testFaucetDto.token);
      await faucetTx.wait();
      return {
        transactionHash: faucetTx.getTransactionHash(),
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
