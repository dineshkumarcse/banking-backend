import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Person } from '../person/person.entity';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockTransactionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

const mockBankAccountRepository = {
  findOne: jest.fn(),
};

const mockPersonRepository = {};

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockBankAccountRepository,
        },
        {
          provide: getRepositoryToken(Person),
          useValue: mockPersonRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a transaction', async () => {
      const createTransactionDto = {
        sender_iban: 'IBAN12345',
        receiver_iban: 'IBAN67890',
        amount: 100,
      };

      const senderAccount = new BankAccount();
      senderAccount.iban = createTransactionDto.sender_iban;
      senderAccount.balance = 500;

      const receiverAccount = new BankAccount();
      receiverAccount.iban = createTransactionDto.receiver_iban;
      receiverAccount.balance = 300;

      const transaction = new Transaction();
      transaction.sender_iban = createTransactionDto.sender_iban;
      transaction.amount = createTransactionDto.amount;

      jest
        .spyOn(mockBankAccountRepository, 'findOne')
        .mockResolvedValueOnce(senderAccount);
      jest
        .spyOn(mockBankAccountRepository, 'findOne')
        .mockResolvedValueOnce(receiverAccount);
      jest
        .spyOn(mockTransactionRepository, 'create')
        .mockReturnValue(transaction);
      jest
        .spyOn(mockTransactionRepository, 'save')
        .mockResolvedValue(transaction);

      const result = await service.create(createTransactionDto);
      expect(result).toEqual(transaction);
    });

    it('should throw NotFoundException if sender bank account is not found', async () => {
      const createTransactionDto = {
        sender_iban: 'IBAN12345',
        receiver_iban: 'IBAN67890',
        amount: 100,
      };

      jest
        .spyOn(mockBankAccountRepository, 'findOne')
        .mockResolvedValueOnce(null);

      await expect(service.create(createTransactionDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if sender account balance is negative', async () => {
      const createTransactionDto = {
        sender_iban: 'sender-iban',
        receiver_iban: 'receiver-iban',
        amount: 100,
      };

      // Mock the sender account with insufficient balance
      const senderAccount = { iban: 'sender-iban', balance: 50 }; // Balance is less than amount
      jest
        .spyOn(mockBankAccountRepository, 'findOne')
        .mockResolvedValueOnce(senderAccount);

      // Mock the receiver account (valid)
      const receiverAccount = { iban: 'receiver-iban' };
      jest
        .spyOn(mockBankAccountRepository, 'findOne')
        .mockResolvedValueOnce(receiverAccount);

      // Expect an InternalServerErrorException for insufficient funds
      await expect(service.create(createTransactionDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of transactions', async () => {
      const transactions = [{ id: 1, iban: 'test-iban', amount: 100 }];
      mockTransactionRepository.find.mockResolvedValue(transactions);

      const result = await service.findAll();
      expect(result).toEqual(transactions);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        relations: ['sender', 'receiver'],
      });
    });

    it('should throw an error if fetching fails', async () => {
      mockTransactionRepository.find.mockRejectedValue(new Error('Failed'));
      await expect(service.findAll()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      const transaction = { id: 1, iban: 'test-iban', amount: 100 };
      mockTransactionRepository.findOne.mockResolvedValue(transaction);

      const result = await service.findOne(1);
      expect(result).toEqual(transaction);
      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['sender', 'receiver'],
      });
    });

    it('should throw NotFoundException if no transaction is found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a transaction', async () => {
      mockTransactionRepository.delete.mockResolvedValue({ affected: 1 });
      await service.remove(1);
      expect(mockTransactionRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if transaction is not found', async () => {
      mockTransactionRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
