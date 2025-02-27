import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('available-tokens')
  async getAvailableTokens(
    @Query('chainId') chainId: number,
  ) {
    try {
      return await this.tokenService.getAvailableTokens(chainId);
    } catch (e) {
      console.log(e);
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('based-token')
  async getBasedToken(@Query('chainId') chainId: number) {
    try {
      return await this.tokenService.getBasedToken(chainId);
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
