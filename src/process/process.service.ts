import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../bank-account/bank-account.entity';
import { Transaction } from '../transaction/transaction.entity';
import { Person } from '../person/person.entity';
import { MaxBorrowing } from '../max-borrowing/max-borrowing.entity';
import { WebhookService } from '../webhook/webhook.service';

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
    private readonly webhookService: WebhookService,
  ) {}

  async updateAccountBalances(): Promise<void> {
    try {
      const unprocessedTransactions = await this.transactionRepository.find({
        where: { processed: false },
      });

      if (!unprocessedTransactions.length) {
        console.log('No unprocessed transactions.');
        return;
      }

      // Loop through each unprocessed transaction
      for (const txn of unprocessedTransactions) {
        // Process the sender's bank account
        await this.bankAccountRepository
          .createQueryBuilder()
          .update(BankAccount)
          .set({ balance: () => 'balance - :amount' })
          .where('iban = :iban', {
            iban: txn.sender_iban,
            amount: txn.amount,
          })
          .execute();

        // Send webhook for sender's account balance update
        const senderAccount = await this.bankAccountRepository.findOne({
          where: { iban: txn.sender_iban },
        });

        const senderPayload = {
          event: 'updateAccountBalances',
          timestamp: new Date().toISOString(),
          message: `Sender's account balance updated to ${senderAccount.balance}.`,
          account: {
            iban: txn.sender_iban,
            balance: senderAccount.balance,
          },
        };
        // Webhook URL from environment variables or config
        const webhookUrl =
          process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
        await this.webhookService.sendNotification(webhookUrl, senderPayload);

        // Process the receiver's bank account
        await this.bankAccountRepository
          .createQueryBuilder()
          .update(BankAccount)
          .set({ balance: () => 'balance + :amount' })
          .where('iban = :iban', {
            iban: txn.receiver_iban,
            amount: txn.amount,
          })
          .execute();

        // Send webhook for receiver's account balance update
        const receiverAccount = await this.bankAccountRepository.findOne({
          where: { iban: txn.receiver_iban },
        });

        const receiverPayload = {
          event: 'updateAccountBalances',
          timestamp: new Date().toISOString(),
          message: `Receiver's account balance updated to ${receiverAccount.balance}.`,
          account: {
            iban: txn.receiver_iban,
            balance: receiverAccount.balance,
          },
        };
        // Webhook URL from environment variables or config
        await this.webhookService.sendNotification(webhookUrl, receiverPayload);
      }

      // Mark transactions as processed
      await this.transactionRepository
        .createQueryBuilder()
        .update(Transaction)
        .set({ processed: true })
        .whereInIds(unprocessedTransactions.map((txn) => txn.id))
        .execute();

      console.log(`${unprocessedTransactions.length} transactions processed.`);
    } catch (error) {
      console.error('Error in updateAccountBalances:', error);
      throw error;
    }
  }

  async calculateNetWorth(
    personId?: number,
  ): Promise<{ personId: number; netWorth: string }[]> {
    try {
      const query = this.bankAccountRepository
        .createQueryBuilder('account')
        .select('account.person_id', 'personId')
        .addSelect('SUM(account.balance)', 'netWorth')
        .groupBy('account.person_id');

      if (personId) {
        query.where('account.person_id = :personId', { personId });
      }

      const results = await query.getRawMany();
      if (!results.length) {
        console.log(`No net worth found for personId: ${personId}`);
      }

      for (const result of results) {
        const netWorth = result.netWorth;

        let maxBorrowing = await this.maxBorrowingRepository.findOne({
          where: { person: { id: result.personId } },
        });

        if (maxBorrowing) {
          maxBorrowing.netWorth = netWorth;
        } else {
          maxBorrowing = this.maxBorrowingRepository.create({
            person: { id: result.personId },
            netWorth,
            maxBorrowAmount: 0,
          });
        }

        await this.maxBorrowingRepository.save(maxBorrowing);
        console.log(`Updated max borrowing for person ${result.personId}`);
        const payload = {
          event: 'calculateNetWorth',
          personId,
          netWorth,
          timestamp: new Date().toISOString(),
        };

        const webhookUrl =
          process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
        await this.webhookService.sendNotification(webhookUrl, payload);
      }

      return results;
    } catch (error) {
      console.error('Error in calculateNetWorth:', error);
      throw error;
    }
  }

  async calculateMaxBorrowing(personId: number): Promise<number> {
    if (!personId) throw new Error('PersonId is required.');

    try {
      const personBalanceResult = await this.bankAccountRepository
        .createQueryBuilder('account')
        .select('SUM(account.balance)', 'totalBalance')
        .where('account.person_id = :personId', { personId })
        .getRawOne();

      const personBalance = parseFloat(
        personBalanceResult?.totalBalance || '0',
      );
      if (personBalance <= 0) return 0;

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
        .addSelect('SUM(account.balance)', 'friendBalance')
        .groupBy('account.person_id')
        .getRawMany();

      const totalBorrowable = friendsBalances.reduce((sum, friend) => {
        const friendBalance = parseFloat(friend.friendBalance || '0');
        return friendBalance > personBalance
          ? sum + (friendBalance - personBalance)
          : sum;
      }, 0);

      const person = await this.personRepository.findOne({
        where: { id: personId },
      });
      if (!person) throw new Error(`Person ${personId} not found.`);

      let maxBorrowing = await this.maxBorrowingRepository.findOne({
        where: { person: { id: personId } },
      });

      if (maxBorrowing) {
        maxBorrowing.maxBorrowAmount = totalBorrowable;
      } else {
        maxBorrowing = this.maxBorrowingRepository.create({
          person,
          maxBorrowAmount: totalBorrowable,
        });
      }

      await this.maxBorrowingRepository.save(maxBorrowing);
      const payload = {
        event: 'calculateMaxBorrowing',
        personId,
        maxBorrowing,
        timestamp: new Date().toISOString(),
      };

      const webhookUrl =
        process.env.WEBHOOK_URL || 'http://localhost:3000/webhook';
      await this.webhookService.sendNotification(webhookUrl, payload);
      return totalBorrowable;
    } catch (error) {
      console.error('Error in calculateMaxBorrowing:', error);
      throw error;
    }
  }
}
