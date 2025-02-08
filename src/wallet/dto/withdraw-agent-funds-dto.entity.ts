import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class WithdrawAgentFundsDto {
  @IsNotEmpty()
  @IsString()
  agentId: string;

  @IsNotEmpty()
  @IsString()
  recipientAddress: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
