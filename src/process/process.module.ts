import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { ProcessController } from './process.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Person } from '../person/person.entity';
import { Transaction } from '../transaction/transaction.entity';
import { MaxBorrowing } from '../max-borrowing/max-borrowing.entity';
import { PersonService } from 'src/person/person.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Person, BankAccount, MaxBorrowing]),
  ],
  providers: [ProcessService, PersonService],
  controllers: [ProcessController],
  exports: [ProcessService],
})
export class ProcessModule {}
