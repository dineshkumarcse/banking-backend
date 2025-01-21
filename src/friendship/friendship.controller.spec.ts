import { Test, TestingModule } from '@nestjs/testing';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { PersonService } from '../person/person.service';
import { CreateFriendshipDto } from './create-friendship.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Friendship } from './friendship.entity';
import { Person } from 'src/person/person.entity';

describe('FriendshipController', () => {
  let controller: FriendshipController;
  let friendshipService: FriendshipService;
  let personService: PersonService;

  const mockPersons: Person[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      bankAccounts: [],
      friendships: [],
      maxBorrowings: [],
    },
    {
      id: 2,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      bankAccounts: [],
      friendships: [],
      maxBorrowings: [],
    },
  ];
  const mockPerson1 = { id: 1, name: 'John Doe', email: 'john@example.com' };
  const mockPerson2 = { id: 2, name: 'Jane Doe', email: 'jane@example.com' };
  const mockFriendship = { person_id: 1, friend_id: 2 };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipController],
      providers: [
        FriendshipService,
        PersonService,
        {
          provide: FriendshipService,
          useValue: {
            createFriendship: jest.fn().mockResolvedValue(mockFriendship),
            getFriendshipsByPerson: jest
              .fn()
              .mockResolvedValue([mockFriendship]),
            deleteFriendship: jest.fn().mockResolvedValue(undefined),
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

    controller = module.get<FriendshipController>(FriendshipController);
    friendshipService = module.get<FriendshipService>(FriendshipService);
    personService = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('createFriendship', () => {
    it('should successfully create a friendship', async () => {
      const createFriendshipDto = { person_id: 1, friend_id: 2 };
      const mockPerson1 = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };
      const mockPerson2 = {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
      const mockFriendship = { person_id: 1, friend_id: 2 };

      // Mock the personService to return mock persons
      personService.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockPerson1)
        .mockResolvedValueOnce(mockPerson2);

      // Mock the createFriendship method
      friendshipService.createFriendship = jest
        .fn()
        .mockResolvedValue(mockFriendship);

      // Call the controller method
      const result = await controller.createFriendship(createFriendshipDto);

      // Assert the result matches the mocked friendship
      expect(result).toEqual(mockFriendship);

      // Assert the service's createFriendship method was called with the correct arguments
      expect(friendshipService.createFriendship).toHaveBeenCalledWith(
        createFriendshipDto.person_id, // 1
        createFriendshipDto.friend_id, // 2
        mockPerson1, // Additional argument 1
        mockPerson2, // Additional argument 2
      );
    });

    it('should throw an error if friendship already exists', async () => {
      friendshipService.createFriendship = jest
        .fn()
        .mockRejectedValueOnce(
          new ConflictException('Friendship already exists'),
        );

      const createFriendshipDto: CreateFriendshipDto = {
        person_id: 1,
        friend_id: 2,
      };

      await expect(
        controller.createFriendship(createFriendshipDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getFriendshipsByPerson', () => {
    it('should return a list of friendships', async () => {
      const result = await controller.getFriendshipsByPerson(1);
      expect(result).toEqual([mockFriendship]);
      expect(friendshipService.getFriendshipsByPerson).toHaveBeenCalledWith(1);
    });

    it('should throw an error if no friendships found', async () => {
      friendshipService.getFriendshipsByPerson = jest
        .fn()
        .mockRejectedValueOnce(new NotFoundException('No friendships found'));
      await expect(controller.getFriendshipsByPerson(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteFriendship', () => {
    it('should successfully delete a friendship', async () => {
      await expect(controller.deleteFriendship(1, 2)).resolves.toEqual({
        message: 'Friendship deleted successfully',
      });
      expect(friendshipService.deleteFriendship).toHaveBeenCalledWith(1, 2);
    });

    it('should throw an error if friendship not found', async () => {
      friendshipService.deleteFriendship = jest
        .fn()
        .mockRejectedValueOnce(new NotFoundException('Friendship not found'));
      await expect(controller.deleteFriendship(1, 2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
