import { Test, TestingModule } from '@nestjs/testing';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { Person } from './person.entity';

describe('PersonController', () => {
  let personController: PersonController;
  let personService: PersonService;

  // Create a valid mock `Person` object
  const mockPerson: Person = {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    bankAccounts: [], // This would be an empty array or populated if needed
    friendships: [], // This would be an empty array or populated if needed
    maxBorrowings: [], // Default value for maxBorrowings
  };

  // If you're mocking multiple people, make sure to include the same structure
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

  // Mock the PersonService
  const mockPersonService = {
    createPerson: jest.fn(),
    getAllPersons: jest.fn(),
    findOne: jest.fn(),
    updatePerson: jest.fn(),
    deletePerson: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonController],
      providers: [
        {
          provide: PersonService,
          useValue: mockPersonService,
        },
      ],
    }).compile();

    personController = module.get<PersonController>(PersonController);
    personService = module.get<PersonService>(PersonService);
  });

  it('should be defined', () => {
    expect(personController).toBeDefined();
  });

  describe('createPerson', () => {
    it('should call createPerson from the service and return the result', async () => {
      const createPersonDto: CreatePersonDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      //const result = { id: 1, ...createPersonDto };

      mockPersonService.createPerson.mockResolvedValue(mockPersons);

      expect(await personController.createPerson(createPersonDto)).toEqual(
        mockPersons,
      );
      expect(mockPersonService.createPerson).toHaveBeenCalledWith(
        createPersonDto.name,
        createPersonDto.email,
      );
    });
  });

  describe('getAllPersons', () => {
    it('should return an array of persons', async () => {
      //const result = [{ id: 1, name: 'John Doe', email: 'john@example.com' }];

      mockPersonService.getAllPersons.mockResolvedValue(mockPersons);

      expect(await personController.getAllPersons()).toEqual(mockPersons);
      expect(mockPersonService.getAllPersons).toHaveBeenCalled();
    });
  });

  describe('getPersonById', () => {
    it('should return a person by id', async () => {
      //const result = { id: 1, name: 'John Doe', email: 'john@example.com' };
      const id = 1;

      mockPersonService.findOne.mockResolvedValue(mockPersons);

      expect(await personController.getPersonById(id)).toEqual(mockPersons);
      expect(mockPersonService.findOne).toHaveBeenCalledWith(id);
    });

    it('should throw an error if person not found', async () => {
      const id = 99;

      mockPersonService.findOne.mockResolvedValue(null);

      await expect(personController.getPersonById(id)).rejects.toThrowError(
        'Person not found',
      );
    });
  });

  describe('updatePerson', () => {
    it('should call updatePerson from the service and return the updated result', async () => {
      const updatePersonDto: UpdatePersonDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
      //const result = { id: 1, ...updatePersonDto };

      mockPersonService.updatePerson.mockResolvedValue(mockPersons);

      const id = 1;
      expect(await personController.updatePerson(id, updatePersonDto)).toEqual(
        mockPersons,
      );
      expect(mockPersonService.updatePerson).toHaveBeenCalledWith(
        id,
        updatePersonDto.name,
        updatePersonDto.email,
      );
    });
  });

  describe('deletePerson', () => {
    it('should call deletePerson from the service and return a success message', async () => {
      const id = 1;

      mockPersonService.deletePerson.mockResolvedValue(undefined);

      const response = await personController.deletePerson(id);

      expect(response).toEqual({ message: 'Person deleted successfully' });
      expect(mockPersonService.deletePerson).toHaveBeenCalledWith(id);
    });
  });
});
