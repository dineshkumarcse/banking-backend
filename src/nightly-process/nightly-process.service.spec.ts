import { Test, TestingModule } from '@nestjs/testing';
import { NightlyProcessService } from './nightly-process.service';
import { ProcessService } from '../process/process.service';
import { PersonService } from '../person/person.service';

describe('NightlyProcessService', () => {
  let nightlyProcessService: NightlyProcessService;
  let processService: ProcessService;
  let personService: PersonService;

  beforeEach(async () => {
    // Explicitly type the mocks
    const processServiceMock = {
      updateAccountBalances: jest.fn(),
      calculateNetWorth: jest.fn(),
      calculateMaxBorrowing: jest.fn(),
    };

    const personServiceMock = {
      getAllPersons: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NightlyProcessService,
        { provide: ProcessService, useValue: processServiceMock },
        { provide: PersonService, useValue: personServiceMock },
      ],
    }).compile();

    nightlyProcessService = module.get<NightlyProcessService>(
      NightlyProcessService,
    );
    processService = module.get<ProcessService>(ProcessService);
    personService = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(nightlyProcessService).toBeDefined();
  });

  describe('runNightlyProcess', () => {
    it('should run the nightly process steps successfully', async () => {
      // Mock data
      const persons = [{ id: 1 }, { id: 2 }];

      // Explicitly cast to the correct types
      (personService.getAllPersons as jest.Mock).mockResolvedValue(persons);

      // Call the method
      await nightlyProcessService.runNightlyProcess();

      // Assert that the methods are called
      expect(processService.updateAccountBalances).toHaveBeenCalled();
      expect(processService.calculateNetWorth).toHaveBeenCalled();
      expect(personService.getAllPersons).toHaveBeenCalled();
      expect(processService.calculateMaxBorrowing).toHaveBeenCalledTimes(
        persons.length,
      );
    });

    it('should catch errors and log them', async () => {
      // Mock the services to throw an error
      const errorMessage = 'Test error';
      (processService.updateAccountBalances as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the method
      try {
        await nightlyProcessService.runNightlyProcess();
      } catch (error) {
        // Expect error to be caught and logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error during nightly process:',
          errorMessage,
        );
      }

      // Cleanup spy
      consoleErrorSpy.mockRestore();
    });
  });
});
