import { IsNotEmpty, IsString } from 'class-validator';

export class AddKnowledgeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
