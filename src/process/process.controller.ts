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
    private readonly processService: ProcessService,
    private readonly personService: PersonService,
  ) {}

  @Post('webhook')
  @UsePipes(new ValidationPipe()) // Apply validation
  async processWebhook(@Body() processWebhookDto: ProcessDto) {
    const { processId, personId } = processWebhookDto;

    // Validate processId
    if (![1, 2, 3].includes(processId)) {
      throw new HttpException('Invalid process ID', HttpStatus.BAD_REQUEST);
    }

    // Process for process_id 1
    if (processId >= 1) {
      await this.processService.updateAccountBalances();
    }

    // Process for process_id 2
    if (processId >= 2) {
      await this.processService.calculateNetWorth();
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
      return { process_id: processId, max_borrow_amount: maxBorrowAmount };
    }

    return { message: `Process ${processId} completed successfully.` };
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
}
