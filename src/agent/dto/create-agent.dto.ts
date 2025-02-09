import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { TokenDto } from './token.dto';
import { AddKnowledgeDto } from './add-knowledge.dto';

export class CreateAgentDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  chainId: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenDto)
  @ArrayMinSize(1)
  selectedTokens: TokenDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddKnowledgeDto)
  knowledges: AddKnowledgeDto[];

  @IsNotEmpty()
  @IsString()
  strategy: string;

  @IsInt()
  @Min(1)
  intervalSeconds: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date; // Ensure valid Date
  })
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  stopLossUSD?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  takeProfitUSD?: number;
}
