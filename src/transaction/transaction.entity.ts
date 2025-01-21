import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BankAccount } from '../bank-account/bank-account.entity';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 34 })
  sender_iban: string;

  @Column({ type: 'varchar', length: 34 })
  receiver_iban: string;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  transaction_date: Date;

  @Column({ type: 'boolean', default: () => 'false' })
  processed: boolean;

  @ManyToOne(
    () => BankAccount,
    (bankAccount) => bankAccount.sendertransactions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'sender_iban', referencedColumnName: 'iban' })
  sender: BankAccount;

  @ManyToOne(
    () => BankAccount,
    (bankAccount) => bankAccount.receivertransactions,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'receiver_iban', referencedColumnName: 'iban' })
  receiver: BankAccount;
}
