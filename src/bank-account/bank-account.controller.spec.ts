import { Test, TestingModule } from '@nestjs/testing';
import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { BankAccount } from './bank-account.entity';
import { NotFoundException } from '@nestjs/common';

describe('BankAccountController', () => {
  let controller: BankAccountController;
  let service: BankAccountService;

  // Mock data
  const mockBankAccount = {
    id: 1,
    iban: 'GB29NWBK60161331926819',
    balance: 1000,
    person: { id: 1, name: 'John Doe', email: 'john@example.com' },
  };

  beforeEach(async () => {
    const mockBankAccountService = {
      create: jest.fn().mockResolvedValue(mockBankAccount),
      findAll: jest.fn().mockResolvedValue([mockBankAccount]),
      findOne: jest.fn().mockResolvedValue(mockBankAccount),
      update: jest.fn().mockResolvedValue(mockBankAccount),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankAccountController],
      providers: [
        {
          provide: BankAccountService,
          useValue: mockBankAccountService, // Mocked BankAccountService
        },
      ],
    }).compile();

    controller = module.get<BankAccountController>(BankAccountController);
    service = module.get<BankAccountService>(BankAccountService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a bank account', async () => {
      const createDto = {
        iban: 'GB29NWBK60161331926819',
        balance: 1000,
        person_id: 1,
      };
      const result = await controller.create(createDto);
      expect(result).toEqual(mockBankAccount);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of bank accounts', async () => {
      const result = await controller.findAll();
      expect(result).toEqual([mockBankAccount]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a bank account by ID', async () => {
      const result = await controller.findOne(1);
      expect(result).toEqual(mockBankAccount);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if the bank account is not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValueOnce(new NotFoundException('Bank account not found'));

      try {
        await controller.findOne(999); // Non-existent ID
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('update', () => {
    it('should update a bank account', async () => {
      const updateDto = { iban: 'GB29NWBK60161331926820', balance: 2000 };
      const result = await controller.update(1, updateDto);
      expect(result).toEqual(mockBankAccount);
      expect(service.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should throw NotFoundException if bank account to update is not found', async () => {
      const updateDto = { iban: 'GB29NWBK60161331926820', balance: 2000 };
      jest
        .spyOn(service, 'update')
        .mockRejectedValueOnce(new NotFoundException('Bank account not found'));

      try {
        await controller.update(999, updateDto); // Non-existent ID
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('remove', () => {
    it('should delete a bank account', async () => {
      await controller.remove(1);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if the bank account is not found for deletion', async () => {
      jest
        .spyOn(service, 'remove')
        .mockRejectedValueOnce(new NotFoundException('Bank account not found'));

      try {
        await controller.remove(999); // Non-existent ID
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
