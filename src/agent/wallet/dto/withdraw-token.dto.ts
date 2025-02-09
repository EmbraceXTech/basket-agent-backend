import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class WithdrawTokenDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  recipientAddress: string;
}
