import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Transaction } from '../transaction/transaction.entity';
import { Person } from '../person/person.entity';
import { MaxBorrowing } from '../max-borrowing/max-borrowing.entity';

@Injectable()
export class ProcessService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Person)
    private personRepository: Repository<Person>,
    @InjectRepository(MaxBorrowing)
    private readonly maxBorrowingRepository: Repository<MaxBorrowing>,
  ) {}

  async updateAccountBalances(): Promise<void> {
    try {
      // Fetch all unprocessed transactions
      const unprocessedTransactions = await this.transactionRepository.find({
        where: { processed: false },
      });

      if (unprocessedTransactions.length === 0) {
        console.log('No unprocessed transactions found.');
        return;
      }

      for (const transaction of unprocessedTransactions) {
        // Update sender's balance (reduce)
        await this.bankAccountRepository
          .createQueryBuilder()
          .update(BankAccount)
          .set({ balance: () => 'balance - :amount' })
          .where('iban = :iban', {
            iban: transaction.sender_iban,
            amount: transaction.amount,
          })
          .execute();

        // Update receiver's balance (increase)
        await this.bankAccountRepository
          .createQueryBuilder()
          .update(BankAccount)
          .set({ balance: () => 'balance + :amount' })
          .where('iban = :iban', {
            iban: transaction.receiver_iban,
            amount: transaction.amount,
          })
          .execute();
      }

      // Mark transactions as processed
      const transactionIds = unprocessedTransactions.map((txn) => txn.id);
      await this.transactionRepository
        .createQueryBuilder()
        .update(Transaction)
        .set({ processed: true })
        .whereInIds(transactionIds)
        .execute();

      console.log(
        `Processed ${transactionIds.length} transactions and updated balances.`,
      );
    } catch (error) {
      console.error('Error while updating account balances:', error);
    }
  }

  /**
   * Helper function to group transactions by IBAN.
   */
  // private groupTransactionsByIban(
  //   transactions: Transaction[],
  // ): Record<string, Transaction[]> {
  //   return transactions.reduce(
  //     (groups, txn) => {
  //       if (!groups[txn.sender_iban]) {
  //         groups[txn.sender_iban] = [];
  //       }
  //       groups[txn.sender_iban].push(txn);
  //       return groups;
  //     },
  //     {} as Record<string, Transaction[]>,
  //   );
  // }

  // async calculateNetWorth(personId?: number): Promise<any> {
  //   try {
  //     //select sum(balance) from bank_account group by person_id
  //     const query = this.bankAccountRepository
  //       .createQueryBuilder('account')
  //       .select('account.person_id', 'personId')
  //       .addSelect('SUM(account.balance)', 'netWorth')
  //       .groupBy('account.person_id');

  //     if (personId) {
  //       query.where('account.person_id = :personId', { personId });
  //     }

  //     console.log('Debug: Generated SQL Query:', query.getSql());
  //     const result = await query.getRawMany();
  //     if (personId) {
  //       return result.length > 0 ? result[0] : { personId, netWorth: 0 };
  //     }
  //     return result;
  //   } catch (error) {
  //     console.error('Error calculating net worth:', error);
  //     throw new Error('Failed to calculate net worth.');
  //   }
  // }

  async calculateNetWorth(
    personId?: number,
  ): Promise<{ personId: number; netWorth: string }[]> {
    try {
      const query = this.bankAccountRepository
        .createQueryBuilder('account')
        .select('account.person_id', 'personId')
        .addSelect('SUM(account.balance)', 'netWorth')
        .where('account.person_id = :personId', { personId })
        .groupBy('account.person_id');

      const result = await query.getRawMany(); // Ensure this always returns an array
      console.log('Calculate Net Worth', result);
      return result;
    } catch (error) {
      console.error('Error calculating net worth:', error);
      throw new Error('Failed to calculate net worth.');
    }
  }

  async calculateMaxBorrowing(personId: number): Promise<number> {
    // Validate the input
    if (!personId) {
      throw new Error('Invalid personId. A valid personId is required.');
    }

    try {
      // Step 1: Fetch the person's total balance
      const personBalanceResult = await this.bankAccountRepository
        .createQueryBuilder('account')
        .select('SUM(account.balance)', 'totalBalance')
        .where('account.person_id = :personId', { personId })
        .getRawOne();

      // Log the fetched result
      console.log(
        `Fetched balance for Person ${personId}:`,
        personBalanceResult,
      );

      // Parse the total balance (if null, default to 0)
      const personBalance = parseFloat(
        personBalanceResult?.totalBalance || '0',
      );
      console.log(`Person ${personId} Balance:`, personBalance);

      // If the person's balance is 0 or null, return 0 immediately
      if (personBalance <= 0) {
        console.log(
          `Person ${personId} has no balance or negative balance. Returning 0.`,
        );
        return 0;
      }

      // Step 2: Fetch the friends total balances  grouped by friend_id
      const friendsBalances = await this.bankAccountRepository
        .createQueryBuilder('account')
        .innerJoin(
          'friendship',
          'friendship',
          `(
            (friendship.person_id = :personId AND friendship.friend_id = account.person_id)
            OR
            (friendship.friend_id = :personId AND friendship.person_id = account.person_id)
          )`,
          { personId },
        )
        .select('account.person_id', 'friendId')
        .addSelect('SUM(account.balance)', 'friendBalance') // Get each individual balance
        .groupBy('account.person_id')
        .getRawMany();

      // Log the fetched friends' balances for debugging
      console.log(
        `Fetched friends' balances for Person ${personId}:`,
        friendsBalances,
      );

      // Step 3: Calculate the maximum borrowable amount
      let totalBorrowable = 0;

      for (const friend of friendsBalances) {
        const friendBalance = parseFloat(friend.friendBalance || '0');
        console.log(`Friend ${friend.friendId} Balance: ${friendBalance}`);

        // Borrowable amount = friend's balance - person's balance (if positive)
        if (friendBalance > personBalance) {
          totalBorrowable += friendBalance - personBalance;
        }
      }
      // Step 4: Fetch the person entity to save the MaxBorrowing record
      const person = await this.personRepository.findOne({
        where: { id: personId },
        relations: ['bankAccounts', 'friendships'],
      });

      if (!person) {
        throw new Error(`Person with id ${personId} not found.`);
      }
      // Step 5: Check for existing max borrowing record
      let maxBorrowing = await this.maxBorrowingRepository.findOne({
        where: { person: { id: personId } },
      });

      // Step 6: Save the calculated max borrowing in the new table
      if (maxBorrowing) {
        // Update existing record
        maxBorrowing.maxBorrowAmount = totalBorrowable;
      } else {
        // Create new record
        maxBorrowing = this.maxBorrowingRepository.create({
          person,
          maxBorrowAmount: totalBorrowable,
        });
      }
      await this.maxBorrowingRepository.save(maxBorrowing);

      // Log and return the total borrowable amount
      console.log(
        `Total Borrowable Amount for Person ${personId}:`,
        totalBorrowable,
      );
      return totalBorrowable;
    } catch (error) {
      console.error('Error calculating maximum borrowing:', error);
      throw new Error('Failed to calculate maximum borrowing.');
    }
  }
}
