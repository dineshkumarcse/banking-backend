import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship } from './friendship.entity';
import { Person } from '../person/person.entity';

@Injectable()
export class FriendshipService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
  ) {}

  // Create a new friendship
  async createFriendship(
    person_id: number,
    friend_id: number,
    person1: Person,
    person2: Person,
  ): Promise<Friendship> {
    try {
      if (!person1 || !person2) {
        throw new NotFoundException('One or both persons not found');
      }

      const existingFriendship = await this.friendshipRepository.findOne({
        where: [
          { person_id, friend_id },
          { person_id: friend_id, friend_id: person_id }, // Check reverse relationship
        ],
      });

      if (existingFriendship) {
        throw new ConflictException('Friendship already exists');
      }

      const friendship = this.friendshipRepository.create({
        person_id,
        friend_id,
        person1,
        person2,
      });

      return await this.friendshipRepository.save(friendship);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create friendship');
    }
  }

  // Get all friendships for a person
  async getFriendshipsByPerson(person_id: number): Promise<Friendship[]> {
    try {
      const friendships = await this.friendshipRepository.find({
        where: [{ person_id }, { friend_id: person_id }],
        relations: ['person1', 'person2'], // Fetch related persons
      });

      if (!friendships.length) {
        throw new NotFoundException(
          `No friendships found for person ID: ${person_id}`,
        );
      }

      return friendships;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve friendships');
    }
  }

  // Delete a friendship
  async deleteFriendship(person_id: number, friend_id: number): Promise<void> {
    try {
      const result = await this.friendshipRepository.delete({
        person_id,
        friend_id,
      });

      if (result.affected === 0) {
        throw new NotFoundException(
          `Friendship between ${person_id} and ${friend_id} not found`,
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete friendship');
    }
  }
}
