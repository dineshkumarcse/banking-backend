// src/transaction/transaction.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
//import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Person } from '../person/person.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const { sender_iban, receiver_iban, amount } = createTransactionDto;

    const senderAccount = await this.bankAccountRepository.findOne({
      where: { iban: sender_iban },
    });
    if (!senderAccount) {
      throw new NotFoundException(
        `Sender bank account with IBAN ${sender_iban} not found.`,
      );
    }

    const receiverAccount = await this.bankAccountRepository.findOne({
      where: { iban: receiver_iban },
    });
    if (!receiverAccount) {
      throw new NotFoundException(
        `Receiver bank account with IBAN ${receiver_iban} not found.`,
      );
    }

    if (senderAccount.balance < amount) {
      throw new InternalServerErrorException('Insufficient balance.');
    }
    try {
      const transaction =
        this.transactionRepository.create(createTransactionDto);
      return await this.transactionRepository.save(transaction);
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create transaction.',
        error,
      );
    }
  }

  async findAll(): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.find({
        relations: ['sender', 'receiver'],
      });
    } catch (error) {
      console.error('Error fetching transactions:', error); // Add this
      throw new InternalServerErrorException(
        'Failed to fetch transactions.',
        error,
      );
    }
  }

  async findOne(id: number): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
        relations: ['sender', 'receiver'],
      });
      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found.`);
      }
      return transaction;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException();
    }
  }

  // async update(
  //   id: number,
  //   updateTransactionDto: UpdateTransactionDto,
  // ): Promise<Transaction> {
  //   try {
  //     const transaction = await this.findOne(id);
  //     Object.assign(transaction, updateTransactionDto);
  //     return await this.transactionRepository.save(transaction);
  //   } catch (error) {
  //     throw error instanceof NotFoundException
  //       ? error
  //       : new InternalServerErrorException(
  //           'Failed to update transaction.',
  //           error,
  //         );
  //   }
  // }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.transactionRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Transaction with ID ${id} not found.`);
      }
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException('Failed to delete transaction.');
    }
  }
}
