import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipService } from './friendship.service';
import { Friendship } from './friendship.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonService } from '../person/person.service';
import { Person } from '../person/person.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('FriendshipService', () => {
  let service: FriendshipService;
  let friendshipRepository: Repository<Friendship>;
  let personService: PersonService;

  const mockPerson1 = new Person();
  mockPerson1.id = 1;
  mockPerson1.name = 'John Doe';
  mockPerson1.email = 'john@example.com';

  const mockPerson2 = new Person();
  mockPerson2.id = 2;
  mockPerson2.name = 'Jane Doe';
  mockPerson2.email = 'jane@example.com';

  const mockFriendship = new Friendship();
  mockFriendship.person_id = 1;
  mockFriendship.friend_id = 2;
  mockFriendship.person1 = mockPerson1;
  mockFriendship.person2 = mockPerson2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendshipService,
        {
          provide: getRepositoryToken(Friendship),
          useValue: {
            create: jest.fn().mockReturnValue(mockFriendship),
            save: jest.fn().mockResolvedValue(mockFriendship),
            findOne: jest.fn().mockResolvedValue(undefined),
            find: jest.fn().mockResolvedValue([mockFriendship]),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: PersonService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPerson1),
          },
        },
      ],
    }).compile();

    service = module.get<FriendshipService>(FriendshipService);
    friendshipRepository = module.get<Repository<Friendship>>(
      getRepositoryToken(Friendship),
    );
    personService = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFriendship', () => {
    it('should successfully create a friendship', async () => {
      const result = await service.createFriendship(
        1,
        2,
        mockPerson1,
        mockPerson2,
      );
      expect(result).toEqual(mockFriendship);
      expect(friendshipRepository.save).toHaveBeenCalledWith(mockFriendship);
    });

    it('should throw an error if friendship already exists', async () => {
      friendshipRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockFriendship); // Mock existing friendship

      await expect(
        service.createFriendship(1, 2, mockPerson1, mockPerson2),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw an error if person not found', async () => {
      await expect(
        service.createFriendship(1, 999, mockPerson1, null),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFriendshipsByPerson', () => {
    it('should return a list of friendships', async () => {
      const result = await service.getFriendshipsByPerson(1);
      expect(result).toEqual([mockFriendship]);
      expect(friendshipRepository.find).toHaveBeenCalledWith({
        where: [{ person_id: 1 }, { friend_id: 1 }],
        relations: ['person1', 'person2'],
      });
    });

    it('should throw an error if no friendships found', async () => {
      friendshipRepository.find = jest.fn().mockResolvedValueOnce([]);
      await expect(service.getFriendshipsByPerson(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteFriendship', () => {
    it('should successfully delete a friendship', async () => {
      const result = await service.deleteFriendship(1, 2);
      expect(result).toBeUndefined();
      expect(friendshipRepository.delete).toHaveBeenCalledWith({
        person_id: 1,
        friend_id: 2,
      });
    });

    it('should throw an error if friendship not found', async () => {
      friendshipRepository.delete = jest
        .fn()
        .mockResolvedValueOnce({ affected: 0 });
      await expect(service.deleteFriendship(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
