import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { PersonService } from '../person/person.service';
import { CreateFriendshipDto } from './create-friendship.dto';

@Controller('friendships')
export class FriendshipController {
  constructor(
    private readonly friendshipService: FriendshipService,
    private readonly personService: PersonService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createFriendship(@Body() createFriendshipDto: CreateFriendshipDto) {
    const { person_id, friend_id } = createFriendshipDto;
    if (person_id == friend_id) {
      return { message: 'personid and friendid cannot be same' };
    }
    // Fetch persons using the person service
    const person1 = await this.personService.findOne(person_id);
    const person2 = await this.personService.findOne(friend_id);

    // Create friendship
    return await this.friendshipService.createFriendship(
      person_id,
      friend_id,
      person1,
      person2,
    );
  }
  @Get(':person_id')
  async getFriendshipsByPerson(@Param('person_id') person_id: number) {
    return await this.friendshipService.getFriendshipsByPerson(person_id);
  }

  @Delete(':person_id/:friend_id')
  async deleteFriendship(
    @Param('person_id') person_id: number,
    @Param('friend_id') friend_id: number,
  ) {
    await this.friendshipService.deleteFriendship(person_id, friend_id);
    return { message: 'Friendship deleted successfully' };
  }
}
