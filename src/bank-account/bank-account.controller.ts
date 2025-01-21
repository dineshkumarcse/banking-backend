// src/bank-account/bank-account.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { BankAccountService } from './bank-account.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Controller('bank-accounts')
export class BankAccountController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  @Post()
  async create(@Body() createBankAccountDto: CreateBankAccountDto) {
    return await this.bankAccountService.create(createBankAccountDto);
  }

  @Get()
  async findAll() {
    return await this.bankAccountService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.bankAccountService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateBankAccountDto: UpdateBankAccountDto,
  ) {
    return await this.bankAccountService.update(id, updateBankAccountDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.bankAccountService.remove(id);
  }
}
