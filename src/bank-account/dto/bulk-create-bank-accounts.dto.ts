// src/bank-account/dto/bulk-create-bank-accounts.dto.ts
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateBankAccountDto } from './create-bank-account.dto';

export class BulkCreateBankAccountsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBankAccountDto)
  accounts!: CreateBankAccountDto[];
}
