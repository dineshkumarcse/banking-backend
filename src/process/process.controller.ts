import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProcessService } from './process.service';
import { PersonService } from '../person/person.service';
import { ProcessDto } from './process.dto';

@Controller('process')
export class ProcessController {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly processService: ProcessService,
  ) {}

  @Post('webhook')
  @UsePipes(new ValidationPipe()) // Apply validation
  async processWebhook(@Body() processWebhookDto: ProcessDto) {
    const { processId, personId } = processWebhookDto;

    // Initialize a response object to capture all steps
    const responseDetails: {
      process_id: number;
      steps: Array<{
        step: string;
        status: string;
        message: string;
        data?: any;
      }>;
      max_borrow_amount?: number; // Optional property
      message?: string;
    } = {
      process_id: processId,
      steps: [],
    };

    // Validate processId
    if (![1, 2, 3].includes(processId)) {
      throw new HttpException('Invalid process ID', HttpStatus.BAD_REQUEST);
    }

    try {
      // Process for process_id 1
      if (processId >= 1) {
        await this.processService.updateAccountBalances();
        responseDetails.steps.push({
          step: 'updateAccountBalances',
          status: 'success',
          message: 'Account balances updated successfully.',
        });
      }

      // Process for process_id 2
      if (processId >= 2) {
        const networth = await this.processService.calculateNetWorth(personId);
        responseDetails.steps.push({
          step: 'calculateNetWorth',
          status: 'success',
          message: 'Net worth calculated successfully.',
          data: { Net_Worth: networth },
        });
      }

      // Process for process_id 3
      if (processId === 3) {
        if (!personId) {
          throw new HttpException(
            'person_id is required for process_id 3',
            HttpStatus.BAD_REQUEST,
          );
        }

        const maxBorrowAmount =
          await this.processService.calculateMaxBorrowing(personId);
        responseDetails.steps.push({
          step: 'calculateMaxBorrowing',
          status: 'success',
          message: 'Max borrowing amount calculated successfully.',
          data: { max_borrow_amount: maxBorrowAmount },
        });

        responseDetails.max_borrow_amount = maxBorrowAmount;
      }

      responseDetails.message = `Process ${processId} completed successfully.`;
      return responseDetails;
    } catch (error) {
      const errorMessage =
        (error as Error).message || 'An unexpected error occurred';
      responseDetails.steps.push({
        step: 'error',
        status: 'failure',
        message: errorMessage,
      });
      throw new HttpException(responseDetails, HttpStatus.BAD_REQUEST);
    }
  }
}

// @Get('/net-worth')
// async calculateNetWorth(@Query('personId') personId?: number): Promise<any> {
//   return this.processService.calculateNetWorth(personId);
// }
// @Post('update-balances')
// async updateBalances(): Promise<string> {
//   await this.processService.updateAccountBalances();
//   return 'Account balances updated successfully!';
// }
// @Get('borrowing/:personId')
// async calculateMaxBorrowing(@Param('personId') personId: number) {
//   const maxBorrow = await this.processService.calculateMaxBorrowing(personId);
//   return { personId, maxBorrow };
// }
