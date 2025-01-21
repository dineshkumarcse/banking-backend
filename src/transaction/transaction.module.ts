import { BankAccount } from './../bank-account/bank-account.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.entity';
import { BankAccountModule } from '../bank-account/bank-account.module';
import { BankAccountService } from '../bank-account/bank-account.service';
import { Person } from '../person/person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Person, Transaction, BankAccount]),
    BankAccountModule,
  ], // Registers Transaction entity with TypeORM
  controllers: [TransactionController], // Adds TransactionController
  providers: [TransactionService, BankAccountService], // Adds TransactionService
  exports: [TransactionService], // Allows TransactionService to be used in other modules
})
export class TransactionModule {}
