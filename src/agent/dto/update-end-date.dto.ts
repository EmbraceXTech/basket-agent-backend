import { IsNotEmpty } from 'class-validator';

export class UpdateEndDateDto {
  @IsNotEmpty()
  endDate: Date;
}
