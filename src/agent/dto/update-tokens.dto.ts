import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { TokenDto } from './token.dto';

export class UpdateTokensDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TokenDto)
  selectedTokens: TokenDto[];
}
