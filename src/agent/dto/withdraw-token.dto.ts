import { IsInt, Min } from 'class-validator';
import { TokenDto } from './token.dto';

export class WithdrawTokenDto extends TokenDto {
  @IsInt()
  @Min(0)
  amount: number;
}
