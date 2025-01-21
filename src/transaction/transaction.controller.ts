import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
//import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionService.create(createTransactionDto);
  }

  @Get()
  async findAll() {
    return await this.transactionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.transactionService.findOne(id);
  }

  // @Patch(':id')
  // async update(
  //   @Param('id') id: number,
  //   @Body() updateTransactionDto: UpdateTransactionDto,
  // ) {
  //   return await this.transactionService.update(id, updateTransactionDto);
  // }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.transactionService.remove(id);
  }
}
