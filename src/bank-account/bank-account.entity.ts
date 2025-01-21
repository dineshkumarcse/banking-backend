import { Transaction } from './../transaction/transaction.entity';
import { Person } from './../person/person.entity';
import {
  Entity,
  Column,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
//import {   } from 'class-validator';

@Entity()
export class BankAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 34, unique: true })
  iban: string;

  @Column({ type: 'numeric' })
  balance: number;

  @ManyToOne(() => Person, (person) => person.bankAccounts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @OneToMany(() => Transaction, (transaction) => transaction.receiver)
  receivertransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.sender)
  sendertransactions: Transaction[];
}
