import { Friendship } from './../friendship/friendship.entity';
import { BankAccount } from './../bank-account/bank-account.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';
import { MaxBorrowing } from '../max-borrowing/max-borrowing.entity';

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column()
  @IsEmail()
  email: string;

  @OneToMany(() => BankAccount, (bankAccount) => bankAccount.person, {
    cascade: true,
  })
  bankAccounts: BankAccount[];

  @OneToMany(() => Friendship, (friendship) => friendship.person1, {
    cascade: true,
  })
  friendships: Friendship[];

  @OneToMany(() => MaxBorrowing, (maxBorrowing) => maxBorrowing.person, {
    cascade: true,
  })
  maxBorrowings: MaxBorrowing[];
}
