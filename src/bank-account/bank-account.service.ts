import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './bank-account.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { Person } from '../person/person.entity';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async create(
    createBankAccountDto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    const { iban, balance, person_id } = createBankAccountDto;

    // Check if the IBAN already exists
    const existingAccount = await this.bankAccountRepository.findOne({
      where: { iban },
    });
    if (existingAccount) {
      throw new Error(`Bank account with IBAN ${iban} already exists.`);
    }

    // Fetch the associated person
    const person = await this.personRepository.findOne({
      where: { id: person_id },
    });
    if (!person) {
      throw new NotFoundException(`Person with ID ${person_id} not found`);
    }

    // Create the bank account
    const bankAccount = this.bankAccountRepository.create({
      iban,
      balance,
      person,
    });

    return this.bankAccountRepository.save(bankAccount);
  }

  async findAll(): Promise<BankAccount[]> {
    try {
      return await this.bankAccountRepository.find({ relations: ['person'] });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch bank accounts.');
    }
  }

  async findOne(id: number): Promise<BankAccount> {
    try {
      const bankAccount = await this.bankAccountRepository.findOne({
        where: { id },
        relations: ['person'],
      });
      if (!bankAccount) {
        throw new NotFoundException(`Bank account with ID ${id} not found.`);
      }
      return bankAccount;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException();
    }
  }

  async update(
    id: number,
    updateBankAccountDto: UpdateBankAccountDto,
  ): Promise<BankAccount> {
    const { iban, balance, person_id } = updateBankAccountDto;

    // Find the existing bank account
    const bankAccount = await this.bankAccountRepository.findOne({
      where: { id },
      relations: ['person'],
    });
    if (!bankAccount) {
      throw new NotFoundException(`BankAccount with ID ${id} not found`);
    }

    // Update fields if provided
    if (iban) bankAccount.iban = iban;
    if (balance !== undefined) bankAccount.balance = balance;

    if (person_id !== undefined) {
      const person = await this.personRepository.findOne({
        where: { id: person_id },
      });
      if (!person)
        throw new NotFoundException(`Person with ID ${person_id} not found`);
      bankAccount.person = person;
    }

    // Save the updated bank account
    return this.bankAccountRepository.save(bankAccount);
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.bankAccountRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Bank account with ID ${id} not found.`);
      }
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            'Failed to delete the bank account.',
          );
    }
  }
}
