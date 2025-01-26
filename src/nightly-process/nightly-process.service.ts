import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProcessService } from '../process/process.service';
import { PersonService } from '../person/person.service';

@Injectable()
export class NightlyProcessService {
  constructor(
    private readonly processService: ProcessService,
    private readonly personService: PersonService,
  ) {}

  // Cron job that will run every night at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    console.log('Starting nightly process at midnight');
    await this.runNightlyProcess();
  }

  // Method to handle nightly tasks
  async runNightlyProcess(): Promise<void> {
    try {
      console.log('Running nightly process...');

      // Step 1: Find the new balance for each bank account using the new transactions.
      await this.processService.updateAccountBalances();

      // Step 2: Calculate each person's net worth.
      await this.processService.calculateNetWorth();

      const persons = await this.personService.getAllPersons();

      for (const person of persons) {
        // Step 3: Get all persons and calculate their borrowing ability.
        await this.processService.calculateMaxBorrowing(person.id);
      }

      console.log('Nightly process completed successfully.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Error during nightly process:', errorMessage);
      throw error;
    }
  }
}
