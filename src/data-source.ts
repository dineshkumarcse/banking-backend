import { DataSource } from 'typeorm';
import { Person } from './person/person.entity';
import { BankAccount } from './bank-account/bank-account.entity';
import { Transaction } from './transaction/transaction.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Jobs@123',
  database: 'banking_db',
  synchronize: false,
  logging: true,
  entities: [Person, BankAccount, Transaction],
  migrations: ['src/migrations/*.ts'],
});
