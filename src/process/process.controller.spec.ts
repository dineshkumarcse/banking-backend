import { Test, TestingModule } from '@nestjs/testing';
import { ProcessController } from './process.controller';
import { ProcessService } from './process.service';
import { PersonService } from '../person/person.service';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockProcessService = {
  updateAccountBalances: jest.fn(),
  calculateNetWorth: jest.fn(),
  calculateMaxBorrowing: jest.fn(),
};

const mockPersonService = {};

describe('ProcessController', () => {
  let controller: ProcessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessController],
      providers: [
        {
          provide: ProcessService,
          useValue: mockProcessService,
        },
        {
          provide: PersonService,
          useValue: mockPersonService,
        },
      ],
    }).compile();

    controller = module.get<ProcessController>(ProcessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('processWebhook', () => {
    it('should throw error for invalid process_id', async () => {
      const invalidProcessId = 99;
      try {
        await controller.processWebhook({ processId: invalidProcessId });
      } catch (error) {
        const httpError = error as HttpException; // Cast to HttpException
        expect(httpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(httpError.getResponse()).toBe('Invalid process ID');
      }
    });

    it('should successfully execute process 1 (update balances)', async () => {
      const processId = 1;
      await controller.processWebhook({ processId: processId });

      expect(mockProcessService.updateAccountBalances).toHaveBeenCalled();
    });

    it('should successfully execute process 2 (calculate net worth)', async () => {
      const processId = 2;
      await controller.processWebhook({ processId: processId });

      expect(mockProcessService.updateAccountBalances).toHaveBeenCalled();
      expect(mockProcessService.calculateNetWorth).toHaveBeenCalled();
    });

    it('should successfully execute process 3 (calculate max borrowing)', async () => {
      const processId = 3;
      const personId = 1;
      mockProcessService.calculateMaxBorrowing.mockResolvedValue(100);

      const result = await controller.processWebhook({
        processId: processId,
        personId: personId,
      });

      expect(mockProcessService.updateAccountBalances).toHaveBeenCalled();
      expect(mockProcessService.calculateNetWorth).toHaveBeenCalled();
      expect(mockProcessService.calculateMaxBorrowing).toHaveBeenCalledWith(
        personId,
      );
      expect(result).toEqual({
        process_id: processId,
        max_borrow_amount: 100,
      });
    });

    it('should throw error if person_id is not provided for process_id 3', async () => {
      const processId = 3;
      try {
        await controller.processWebhook({ processId: processId });
      } catch (error) {
        const httpError = error as HttpException; // Cast to HttpException
        expect(httpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(httpError.getResponse()).toBe(
          'person_id is required for process_id 3',
        );
      }
    });
  });
});
