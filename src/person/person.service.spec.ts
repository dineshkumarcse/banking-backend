import { Test, TestingModule } from '@nestjs/testing';
import { PersonService } from './person.service';
import { Repository } from 'typeorm';
import { Person } from './person.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('PersonService', () => {
  let service: PersonService;
  let repository: Repository<Person>;

  const mockPersonRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: getRepositoryToken(Person),
          useValue: mockPersonRepository,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
    repository = module.get<Repository<Person>>(getRepositoryToken(Person));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  //   it('should create a person successfully', async () => {
  //     const name = 'John Doe';
  //     const email = 'johndoe@example.com';
  //     const person = { id: 1, name, email } as Person;

  //     mockPersonRepository.findOne.mockResolvedValue(null); // No existing person
  //     mockPersonRepository.create.mockReturnValue(person);
  //     mockPersonRepository.save.mockResolvedValue(person);

  //     const result = await service.createPerson(name, email);
  //     expect(result).toEqual(person);
  //     expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
  //       where: { email },
  //     });
  //     expect(mockPersonRepository.create).toHaveBeenCalledWith({ name, email });
  //     expect(mockPersonRepository.save).toHaveBeenCalledWith(person);
  //   });

  //   it('should throw ConflictException if person with email exists', async () => {
  //     const email = 'johndoe@example.com';
  //     const existingPerson = { id: 1, name: 'John Doe', email } as Person;

  //     mockPersonRepository.findOne.mockResolvedValue(existingPerson);

  //     await expect(service.createPerson('John Doe', email)).rejects.toThrow(
  //       ConflictException,
  //     );
  //     expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
  //       where: { email },
  //     });
  //   });

  //   it('should throw InternalServerErrorException on unexpected error', async () => {
  //     const email = 'johndoe@example.com';

  //     mockPersonRepository.findOne.mockRejectedValue(
  //       new Error('Database error'),
  //     );

  //     await expect(service.createPerson('John Doe', email)).rejects.toThrow(
  //       InternalServerErrorException,
  //     );
  //     expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
  //       where: { email },
  //     });
  //   });
  // });

  describe('getAllPersons', () => {
    it('should return all persons', async () => {
      const persons = [
        { id: 1, name: 'John Doe', email: 'johndoe@example.com' },
        { id: 2, name: 'Jane Doe', email: 'janedoe@example.com' },
      ] as Person[];

      mockPersonRepository.find.mockResolvedValue(persons);

      const result = await service.getAllPersons();
      expect(result).toEqual(persons);
      expect(mockPersonRepository.find).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockPersonRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getAllPersons()).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockPersonRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return the person if found', async () => {
      const person = {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
      } as Person;

      mockPersonRepository.findOne.mockResolvedValue(person);

      const result = await service.findOne(1);
      expect(result).toEqual(person);
      expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if person not found', async () => {
      mockPersonRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
      expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    // it('should throw InternalServerErrorException on error', async () => {
    //   mockPersonRepository.findOne.mockRejectedValue(
    //     new Error('Database error'),
    //   );

    //   await expect(service.findOne(1)).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    //   expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
    //     where: { id: 1 },
    //   });
    // });
  });
  describe('createPersons', () => {
    it('should create multiple persons successfully', async () => {
      const createPersonDtos = [
        { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
        { name: 'Bob Smith', email: 'bob.smith@example.com' },
      ];

      const createdPersons = createPersonDtos.map((dto, index) => ({
        id: index + 1,
        ...dto,
      }));

      mockPersonRepository.create.mockImplementation((dto) => dto);
      mockPersonRepository.save.mockResolvedValue(createdPersons);

      const result = await service.createPersons(createPersonDtos);

      expect(mockPersonRepository.create).toHaveBeenCalledTimes(2);
      expect(mockPersonRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining(createPersonDtos),
      );
      expect(result).toEqual(createdPersons);
    });

    it('should throw ConflictException if duplicate email is found', async () => {
      const createPersonDtos = [
        { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
        { name: 'Bob Smith', email: 'bob.smith@example.com' },
      ];

      // Mock a TypeORM unique constraint violation error
      const conflictError = new Error('Duplicate entry');
      Object.assign(conflictError, { code: '23505' }); // Add the code property explicitly

      mockPersonRepository.create.mockImplementation((dto) => dto);
      mockPersonRepository.save.mockRejectedValue(conflictError);

      await expect(service.createPersons(createPersonDtos)).rejects.toThrow(
        ConflictException,
      );

      expect(mockPersonRepository.create).toHaveBeenCalledTimes(2);
      expect(mockPersonRepository.save).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const createPersonDtos = [
        { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
      ];

      // Mock a generic error
      const genericError = new Error('Database error');
      mockPersonRepository.create.mockImplementation((dto) => dto);
      mockPersonRepository.save.mockRejectedValue(genericError);

      await expect(service.createPersons(createPersonDtos)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockPersonRepository.create).toHaveBeenCalledTimes(1);
      expect(mockPersonRepository.save).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const createPersonDtos = [
        { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
      ];

      mockPersonRepository.create.mockImplementation((dto) => dto);
      mockPersonRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createPersons(createPersonDtos)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(mockPersonRepository.create).toHaveBeenCalledTimes(1);
      expect(mockPersonRepository.save).toHaveBeenCalled();
    });
  });
  describe('updatePerson', () => {
    it('should update and return the person', async () => {
      const person = {
        id: 1,
        name: 'John Doe',
        email: 'johndoe@example.com',
      } as Person;

      mockPersonRepository.findOne.mockResolvedValue(person);
      mockPersonRepository.save.mockResolvedValue({
        ...person,
        name: 'Jane Doe',
      });

      const result = await service.updatePerson(1, 'Jane Doe', null);
      expect(result).toEqual({ ...person, name: 'Jane Doe' });
      expect(mockPersonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPersonRepository.save).toHaveBeenCalledWith({
        ...person,
        name: 'Jane Doe',
      });
    });

    // it('should throw NotFoundException if person not found', async () => {
    //   mockPersonRepository.findOne.mockResolvedValue(null);

    //   await expect(service.updatePerson(1, 'Jane Doe', null)).rejects.toThrow(
    //     NotFoundException,
    //   );
    // });

    it('should throw InternalServerErrorException on error', async () => {
      mockPersonRepository.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.updatePerson(1, 'Jane Doe', null)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('deletePerson', () => {
    it('should delete the person successfully', async () => {
      mockPersonRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deletePerson(1);
      expect(mockPersonRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if person not found', async () => {
      mockPersonRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.deletePerson(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockPersonRepository.delete.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.deletePerson(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
