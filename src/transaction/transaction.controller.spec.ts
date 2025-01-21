import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

const mockTransactionService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('TransactionController', () => {
  let controller: TransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create and return its result', async () => {
      const dto = { iban: 'test-iban', amount: 100 };
      mockTransactionService.create.mockResolvedValue(dto);

      const result = await controller.create(dto as any);
      expect(result).toEqual(dto);
      expect(mockTransactionService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll and return its result', async () => {
      const transactions = [{ id: 1, iban: 'test-iban', amount: 100 }];
      mockTransactionService.findAll.mockResolvedValue(transactions);

      const result = await controller.findAll();
      expect(result).toEqual(transactions);
      expect(mockTransactionService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return its result', async () => {
      const transaction = { id: 1, iban: 'test-iban', amount: 100 };
      mockTransactionService.findOne.mockResolvedValue(transaction);

      const result = await controller.findOne(1);
      expect(result).toEqual(transaction);
      expect(mockTransactionService.findOne).toHaveBeenCalledWith(1);
    });
  });

  // describe('update', () => {
  //   it('should call service.update and return its result', async () => {
  //     const updatedTransaction = { id: 1, amount: 200 };
  //     mockTransactionService.update.mockResolvedValue(updatedTransaction);

  //     const result = await controller.update(1, { amount: 200 } as any);
  //     expect(result).toEqual(updatedTransaction);
  //     expect(mockTransactionService.update).toHaveBeenCalledWith(1, {
  //       amount: 200,
  //     });
  //   });
  // });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockTransactionService.remove.mockResolvedValue(undefined);
      await controller.remove(1);
      expect(mockTransactionService.remove).toHaveBeenCalledWith(1);
    });
  });
});
