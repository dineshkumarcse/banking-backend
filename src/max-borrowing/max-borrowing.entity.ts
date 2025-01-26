import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Person } from '../person/person.entity';

@Entity()
export class MaxBorrowing {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Person, (person) => person.maxBorrowings)
  @JoinColumn({ name: 'person_id' })
  person: Person;

  @Column('decimal', { precision: 10, scale: 2, name: 'net_worth' })
  netWorth: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'max_borrow_amount' })
  maxBorrowAmount: number;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
