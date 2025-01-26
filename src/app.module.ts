import {
  Module,
  OnApplicationBootstrap,
  MiddlewareConsumer,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './person/person.entity';
import { BankAccount } from './bank-account/bank-account.entity';
import { Transaction } from './transaction/transaction.entity';
import { Friendship } from './friendship/friendship.entity';
//import { SeederService } from './seeder/seeder.service';
import { PersonService } from './person/person.service';
import { PersonController } from './person/person.controller';
import { WebhookController } from './webhook/webhook.controller';
// import { WebhookService } from './webhook/webhook.service';
import { BankAccountService } from './bank-account/bank-account.service';
import { BankAccountController } from './bank-account/bank-account.controller';
import { TransactionController } from './transaction/transaction.controller';
import { TransactionService } from './transaction/transaction.service';
import { FriendshipService } from './friendship/friendship.service';
import { FriendshipController } from './friendship/friendship.controller';
import { ProcessModule } from './process/process.module';
import { LoggerMiddleware } from './logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { NightlyProcessService } from './nightly-process/nightly-process.service';
import { MaxBorrowing } from './max-borrowing/max-borrowing.entity';
import { NightlyProcessModule } from './nightly-process/nightly-process.module';
import { PersonModule } from './person/person.module';
import { BankAccountModule } from './bank-account/bank-account.module';
import { FriendshipModule } from './friendship/friendship.module';
import { TransactionModule } from './transaction/transaction.module';
import { WebhookModule } from './webhook/webhook.module';
import { HttpModule } from '@nestjs/axios';
import { WebhookService } from './webhook/webhook.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Jobs@123',
      database: 'banking_db',
      autoLoadEntities: true,
      synchronize: true,
      entities: [Person, BankAccount, Transaction, Friendship, MaxBorrowing],
    }),
    TypeOrmModule.forFeature([
      Person,
      BankAccount,
      Transaction,
      Friendship,
      MaxBorrowing,
    ]),
    ProcessModule,
    NightlyProcessModule,
    PersonModule,
    BankAccountModule,
    FriendshipModule,
    TransactionModule,
    WebhookModule,
    HttpModule,
  ],
  controllers: [
    AppController,
    PersonController,
    WebhookController,
    BankAccountController,
    TransactionController,
    FriendshipController,
  ],
  providers: [
    AppService,
    //SeederService,
    PersonService,
    // WebhookService,
    BankAccountService,
    TransactionService,
    FriendshipService,
    NightlyProcessService,
    WebhookService,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
  //constructor(private readonly seederService: SeederService) {}
  async onApplicationBootstrap() {
    //await this.seederService.seed();
  }
}
