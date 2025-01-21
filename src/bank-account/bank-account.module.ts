import { BankAccount } from './bank-account.entity';
import { BankAccountService } from './bank-account.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
//import { PersonModule } from 'src/person/person.module';
import { Person } from '../person/person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BankAccount, Person])],
  providers: [BankAccountService],
  exports: [BankAccountService],
})
export class BankAccountModule {}
