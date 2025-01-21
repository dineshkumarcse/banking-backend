import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateBankAccountDto {
  @IsNotEmpty()
  @IsString()
  iban: string;

  @IsNotEmpty()
  @IsNumber()
  balance: number;

  @IsNotEmpty()
  @IsNumber()
  person_id: number;
}
