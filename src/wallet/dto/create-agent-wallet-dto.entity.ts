import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateAgentWalletDto {
  @IsNotEmpty()
  @IsString()
  agentId: string;
}
