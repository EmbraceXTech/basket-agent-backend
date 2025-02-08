import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class TestFaucetDto {
  @IsNotEmpty()
  @IsString()
  agentId: string;

  @IsNotEmpty()
  @IsString()
  token: string;
}
