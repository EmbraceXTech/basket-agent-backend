import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class WithdrawTokenDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['eth', 'usdc'])
  assetId: 'eth' | 'usdc';

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  recipientAddress: string;
}
