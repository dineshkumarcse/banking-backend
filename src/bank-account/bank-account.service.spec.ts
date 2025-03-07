import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccountService } from './bank-account.service';
import { BankAccount } from './bank-account.entity';
import { Person } from '../person/person.entity';
import { NotFoundException } from '@nestjs/common';

const mockBankAccountRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockPersonRepository = () => ({
  findOne: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('BankAccountService', () => {
  let service: BankAccountService;
  let bankAccountRepository: MockRepository<BankAccount>;
  let personRepository: MockRepository<Person>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankAccountService,
        {
          provide: getRepositoryToken(BankAccount),
          useFactory: mockBankAccountRepository,
        },
        {
          provide: getRepositoryToken(Person),
          useFactory: mockPersonRepository,
        },
      ],
    }).compile();

    service = module.get<BankAccountService>(BankAccountService);
    bankAccountRepository = module.get<MockRepository<BankAccount>>(
      getRepositoryToken(BankAccount),
    );
    personRepository = module.get<MockRepository<Person>>(
      getRepositoryToken(Person),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a bank account', async () => {
      const createBankAccountDto = {
        iban: 'IBAN123',
        balance: 1000,
        person_id: 1,
      };

      const person = { id: 1, name: 'John Doe', email: 'john@example.com' };
      const savedBankAccount = { ...createBankAccountDto, id: 1, person };

      personRepository.findOne.mockResolvedValue(person);
      bankAccountRepository.create.mockReturnValue(savedBankAccount);
      bankAccountRepository.save.mockResolvedValue(savedBankAccount);

      const result = await service.create(createBankAccountDto);
      expect(result).toEqual(savedBankAccount);
      expect(personRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(bankAccountRepository.create).toHaveBeenCalledWith({
        iban: 'IBAN123',
        balance: 1000,
        person,
      });
    });

    it('should throw an error if the IBAN already exists', async () => {
      const createBankAccountDto = {
        iban: 'IBAN123',
        balance: 1000,
        person_id: 1,
      };

      bankAccountRepository.findOne.mockResolvedValue({});
      await expect(service.create(createBankAccountDto)).rejects.toThrow(
        'Bank account with IBAN IBAN123 already exists.',
      );
    });

    it('should throw an error if the person does not exist', async () => {
      const createBankAccountDto = {
        iban: 'IBAN123',
        balance: 1000,
        person_id: 1,
      };

      personRepository.findOne.mockResolvedValue(null);
      await expect(service.create(createBankAccountDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all bank accounts', async () => {
      const bankAccounts = [
        { id: 1, iban: 'IBAN123', balance: 1000 },
        { id: 2, iban: 'IBAN456', balance: 2000 },
      ];

      bankAccountRepository.find.mockResolvedValue(bankAccounts);
      const result = await service.findAll();
      expect(result).toEqual(bankAccounts);
    });
  });

  describe('findOne', () => {
    it('should return a bank account by ID', async () => {
      const bankAccount = { id: 1, iban: 'IBAN123', balance: 1000 };

      bankAccountRepository.findOne.mockResolvedValue(bankAccount);
      const result = await service.findOne(1);
      expect(result).toEqual(bankAccount);
    });

    it('should throw a NotFoundException if the bank account does not exist', async () => {
      bankAccountRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a bank account', async () => {
      const bankAccount = { id: 1, iban: 'IBAN123', balance: 1000 };
      const updateDto = { balance: 1500 };

      bankAccountRepository.findOne.mockResolvedValue(bankAccount);
      bankAccountRepository.save.mockResolvedValue({
        ...bankAccount,
        ...updateDto,
      });

      const result = await service.update(1, updateDto);
      expect(result).toEqual({ ...bankAccount, ...updateDto });
    });

    it('should throw a NotFoundException if the bank account does not exist', async () => {
      bankAccountRepository.findOne.mockResolvedValue(null);
      await expect(service.update(1, { balance: 1500 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a bank account', async () => {
      bankAccountRepository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(1)).resolves.not.toThrow();
    });

    it('should throw a NotFoundException if the bank account does not exist', async () => {
      bankAccountRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });
  });
});
