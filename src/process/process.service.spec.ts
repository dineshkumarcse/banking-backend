import { Test, TestingModule } from '@nestjs/testing';
import { ProcessService } from './process.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Transaction } from '../transaction/transaction.entity';
import { Person } from '../person/person.entity';
import { MaxBorrowing } from '../max-borrowing/max-borrowing.entity';

const mockBankAccountRepository = {
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};
const mockTransactionRepository = {
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};
const mockPersonRepository = {
  findOne: jest.fn(),
};
const mockMaxBorrowingRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('ProcessService', () => {
  let service: ProcessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessService,
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockBankAccountRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Person),
          useValue: mockPersonRepository,
        },
        {
          provide: getRepositoryToken(MaxBorrowing),
          useValue: mockMaxBorrowingRepository,
        },
      ],
    }).compile();

    service = module.get<ProcessService>(ProcessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateAccountBalances', () => {
    it('should update account balances and mark transactions as processed', async () => {
      const mockTransactions = [
        { id: 1, iban: 'ABC123', amount: 100, processed: false },
        { id: 2, iban: 'ABC123', amount: -50, processed: false },
      ];
      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockBankAccountRepository.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      });
      mockTransactionRepository.createQueryBuilder.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      });

      await service.updateAccountBalances();

      expect(mockTransactionRepository.find).toHaveBeenCalled();
      expect(
        mockBankAccountRepository.createQueryBuilder().update,
      ).toHaveBeenCalled();
      expect(
        mockTransactionRepository.createQueryBuilder().update,
      ).toHaveBeenCalled();
    });
  });

  describe('calculateNetWorth', () => {
    it('should calculate net worth for a given person', async () => {
      const personId = 1;

      jest
        .spyOn(mockBankAccountRepository, 'createQueryBuilder')
        .mockReturnValue({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([
            { personId: 1, netWorth: '3000' }, // Mocked query result
          ]),
          getSql: jest
            .fn()
            .mockReturnValue(
              'SELECT account.person_id, SUM(account.balance) FROM ...',
            ), // Mocked SQL
        } as any);

      const result = await service.calculateNetWorth(personId);

      expect(result).toEqual([{ personId: 1, netWorth: '3000' }]);
    });
  });

  // describe('calculateMaxBorrowing', () => {
  //   it('should calculate the maximum borrowing amount', async () => {
  //     const mockPersonBalance = { totalBalance: '500' };
  //     const mockFriendsBalances = [
  //       { friendId: 2, friendBalance: '700' },
  //       { friendId: 3, friendBalance: '600' },
  //     ];
  //     mockBankAccountRepository.createQueryBuilder.mockImplementation(() => ({
  //       select: jest.fn().mockReturnThis(),
  //       where: jest.fn().mockReturnThis(),
  //       getRawOne: jest.fn().mockResolvedValue(mockPersonBalance),
  //       innerJoin: jest.fn().mockReturnThis(),
  //       addSelect: jest.fn().mockReturnThis(),
  //       getRawMany: jest.fn().mockResolvedValue(mockFriendsBalances),
  //     }));
  //     mockPersonRepository.findOne.mockResolvedValue({
  //       id: 1,
  //       bankAccounts: [],
  //       friendships: [],
  //     });
  //     mockMaxBorrowingRepository.findOne.mockResolvedValue(null);
  //     mockMaxBorrowingRepository.create.mockReturnValue({});
  //     mockMaxBorrowingRepository.save.mockResolvedValue({});

  //     const result = await service.calculateMaxBorrowing(1);
  //     expect(result).toEqual(300); // (700 - 500) + (600 - 500)
  //   });

  describe('calculateMaxBorrowing', () => {
    it('should calculate the maximum borrowing amount correctly', async () => {
      const mockPersonBalance = { totalBalance: '500' };
      const mockFriendsBalances = [
        { friendId: 2, friendBalance: '700' },
        { friendId: 3, friendBalance: '600' },
      ];
      const mockPerson = { id: 1, bankAccounts: [], friendships: [] };

      // Mocking createQueryBuilder for the person's balance
      const personBalanceQueryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockPersonBalance),
      };

      // Mocking createQueryBuilder for friends' balances
      const friendsBalancesQueryBuilderMock = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockFriendsBalances),
      };

      // Mock the createQueryBuilder behavior for specific cases
      mockBankAccountRepository.createQueryBuilder = jest
        .fn()
        .mockImplementationOnce(() => personBalanceQueryBuilderMock) // First call for person's balance
        .mockImplementationOnce(() => friendsBalancesQueryBuilderMock); // Second call for friends' balances

      // Mocking PersonRepository
      mockPersonRepository.findOne = jest.fn().mockResolvedValue(mockPerson);

      // Mocking MaxBorrowingRepository
      mockMaxBorrowingRepository.findOne = jest.fn().mockResolvedValue(null);
      mockMaxBorrowingRepository.create = jest.fn().mockReturnValue({});
      mockMaxBorrowingRepository.save = jest.fn().mockResolvedValue({});

      const result = await service.calculateMaxBorrowing(1);

      // Assertions
      expect(result).toEqual(300); // (700 - 500) + (600 - 500)
      expect(
        mockBankAccountRepository.createQueryBuilder,
      ).toHaveBeenCalledTimes(2); // Once for each query
      expect(personBalanceQueryBuilderMock.select).toHaveBeenCalledWith(
        'SUM(account.balance)',
        'totalBalance',
      );
      expect(friendsBalancesQueryBuilderMock.groupBy).toHaveBeenCalledWith(
        'account.person_id',
      );
      expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['bankAccounts', 'friendships'],
      });
      expect(mockMaxBorrowingRepository.create).toHaveBeenCalledWith({
        person: mockPerson,
        maxBorrowAmount: 300,
      });
      expect(mockMaxBorrowingRepository.save).toHaveBeenCalled();
    });
  });
});
