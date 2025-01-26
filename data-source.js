'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require('typeorm');
const person_entity_1 = require('./src/person/person.entity');
const bank_account_entity_1 = require('./src/bank-account/bank-account.entity');
const transaction_entity_1 = require('./src/transaction/transaction.entity');
exports.AppDataSource = new typeorm_1.DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'Jobs@123',
  database: 'banking_db',
  synchronize: false,
  logging: true,
  entities: [
    person_entity_1.Person,
    bank_account_entity_1.BankAccount,
    transaction_entity_1.Transaction,
  ],
  migrations: ['src/migrations/*.ts'],
});
//# sourceMappingURL=data-source.js.map
