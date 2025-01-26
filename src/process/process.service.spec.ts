import { Test, TestingModule } from '@nestjs/testing';
import { ProcessService } from './process.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Transaction } from '../transaction/transaction.entity';
import { Person } from '../person/person.entity';
import { MaxBorrowing } from '../max-borrowing/max-borrowing.entity';
import { WebhookService } from '../webhook/webhook.service';

describe('ProcessService', () => {
  let service: ProcessService;
  let transactionRepository: Repository<Transaction>;
  let webhookService: WebhookService;

  const mockQueryBuilder = {
    getRawMany: jest.fn(),
    getRawOne: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereInIds: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
  };
  const mockBankAccountRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
  };

  const mockTransactionRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    update: jest.fn(),
  };

  const mockPersonRepository = {
    findOne: jest.fn(),
  };

  const mockMaxBorrowingRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockReturnValue({}),
    save: jest.fn(),
  };

  const mockWebhookService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    // Mock the console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

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
        {
          provide: WebhookService,
          useValue: mockWebhookService,
        },
      ],
    }).compile();

    service = module.get<ProcessService>(ProcessService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateAccountBalances', () => {
    it('should process unprocessed transactions and update account balances', async () => {
      const mockTransaction = {
        id: 1,
        sender_iban: '123',
        receiver_iban: '456',
        amount: 100,
        processed: false,
      };
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);
      mockBankAccountRepository.findOne
        .mockResolvedValueOnce({ balance: 400 }) // sender
        .mockResolvedValueOnce({ balance: 600 }); // receiver

      await service.updateAccountBalances();

      expect(
        mockBankAccountRepository.createQueryBuilder().update,
      ).toHaveBeenCalledTimes(3);
    });

    it('should log when no unprocessed transactions', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      await service.updateAccountBalances();

      expect(console.log).toHaveBeenCalledWith('No unprocessed transactions.');
    });
  });

  describe('calculateNetWorth', () => {
    it('should calculate net worth for a person and send webhook', async () => {
      const mockAccount = { person_id: 1, balance: 500 };
      mockQueryBuilder.getRawMany.mockResolvedValue([mockAccount]);
      mockMaxBorrowingRepository.findOne.mockResolvedValue(null);

      await service.calculateNetWorth(1);

      expect(mockMaxBorrowingRepository.create).toHaveBeenCalled();
      expect(mockWebhookService.sendNotification).toHaveBeenCalled();
    });

    it('should log when no net worth found', async () => {
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      await service.calculateNetWorth(1);

      expect(console.log).toHaveBeenCalledWith(
        'No net worth found for personId: 1',
      );
    });
  });

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

      // Mocking PersonRepository's findOne
      mockPersonRepository.findOne.mockResolvedValue(mockPerson);

      // Mocking MaxBorrowingRepository behavior
      mockMaxBorrowingRepository.findOne.mockResolvedValue(null);
      mockMaxBorrowingRepository.create.mockReturnValue({});
      mockMaxBorrowingRepository.save.mockResolvedValue({});

      const result = await service.calculateMaxBorrowing(1);

      // Assertions
      expect(result).toEqual(300); // Expected borrowable amount
      expect(
        mockBankAccountRepository.createQueryBuilder,
      ).toHaveBeenCalledTimes(2); // Called twice
      expect(personBalanceQueryBuilderMock.select).toHaveBeenCalledWith(
        'SUM(account.balance)',
        'totalBalance',
      );
      expect(friendsBalancesQueryBuilderMock.groupBy).toHaveBeenCalledWith(
        'account.person_id',
      );
      expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockMaxBorrowingRepository.create).toHaveBeenCalledWith({
        person: mockPerson,
        maxBorrowAmount: 300,
      });
      expect(mockMaxBorrowingRepository.save).toHaveBeenCalled();
      expect(mockWebhookService.sendNotification).toHaveBeenCalled();
      expect(result).toBeGreaterThan(0); // Expect the result to be greater than zero
    });

    it('should throw an error if personId is not provided', async () => {
      await expect(service.calculateMaxBorrowing(undefined)).rejects.toThrow(
        'PersonId is required.',
      );
    });
  });
});
