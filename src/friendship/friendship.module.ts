import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { PersonService } from '../person/person.service';
import { Friendship } from './friendship.entity';
import { PersonModule } from '../person/person.module';
import { Person } from '../person/person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, Person]), PersonModule],
  controllers: [FriendshipController],
  providers: [FriendshipService, PersonService],
})
export class FriendshipModule {}
