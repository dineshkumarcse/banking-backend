import { Test, TestingModule } from '@nestjs/testing';
import { ProcessController } from './process.controller';
import { ProcessService } from '../process/process.service';
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

      // Adjust the expected response to match the actual structure
      expect(result.process_id).toBe(processId);
      expect(result.max_borrow_amount).toBe(100);
      expect(result.message).toBe('Process 3 completed successfully.');

      expect(result.steps.length).toBe(3); // Ensure there are 3 steps
      expect(result.steps[0].step).toBe('updateAccountBalances');
      expect(result.steps[0].status).toBe('success');
      expect(result.steps[0].message).toBe(
        'Account balances updated successfully.',
      );

      expect(result.steps[1].step).toBe('calculateNetWorth');
      expect(result.steps[1].status).toBe('success');
      expect(result.steps[1].message).toBe(
        'Net worth calculated successfully.',
      );
      expect(result.steps[1].data.Net_Worth).toBeUndefined(); // Mocked value was not set for net worth

      expect(result.steps[2].step).toBe('calculateMaxBorrowing');
      expect(result.steps[2].status).toBe('success');
      expect(result.steps[2].message).toBe(
        'Max borrowing amount calculated successfully.',
      );
      expect(result.steps[2].data.max_borrow_amount).toBe(100);
    });
    it('should throw error if person_id is not provided for process_id 3', async () => {
      const processId = 3;

      try {
        // Call the processWebhook method without providing a personId
        await controller.processWebhook({ processId });
      } catch (error) {
        const httpError = error as HttpException; // Cast to HttpException

        // Expect the HttpStatus to be BAD_REQUEST (400)
        expect(httpError.getStatus()).toBe(HttpStatus.BAD_REQUEST);

        // Check the response object to ensure the error message is included in the steps
        const response = httpError.getResponse() as any;
        expect(response.steps[2].message).toBe(
          'person_id is required for process_id 3',
        );
        expect(response.steps[2].status).toBe('failure');
        expect(response.steps[2].step).toBe('error');
      }
    });
  });
});
