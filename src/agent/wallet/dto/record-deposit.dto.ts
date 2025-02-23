import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class RecordDepositDto {
  @IsNotEmpty()
  @IsString()
  transactionHash: string;
}
