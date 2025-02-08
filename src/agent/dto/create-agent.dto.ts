import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { TokenDto } from './token.dto';

export class CreateAgentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  chainId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenDto)
  selectedTokens: TokenDto[];

  @IsNotEmpty()
  @IsString()
  strategy: string;

  @IsInt()
  @Min(1)
  intervalSeconds: number;

  @IsNotEmpty()
  endDate: Date;

  @IsInt()
  @Min(0)
  stopLossUSD: number;

  @IsInt()
  @Min(0)
  takeProfitUSD: number;
}
