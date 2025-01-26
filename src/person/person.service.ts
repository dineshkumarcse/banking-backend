import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './person.entity';
import { CreatePersonDto } from './dto/create-person.dto';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  // Create multiple persons
  async createPersons(createPersonDtos: CreatePersonDto[]): Promise<Person[]> {
    const persons = createPersonDtos.map(({ name, email }) =>
      this.personRepository.create({ name, email }),
    );

    try {
      const savedPersons = await this.personRepository.save(persons);
      return savedPersons;
    } catch (error: any) {
      if (error?.code === '23505') {
        // Handle unique constraint violation
        throw new ConflictException(
          'One or more persons have duplicate emails',
        );
      }
      // Handle generic errors
      throw new InternalServerErrorException('Failed to create persons');
    }
  }

  // Get all persons
  async getAllPersons(): Promise<Person[]> {
    try {
      return await this.personRepository.find();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve persons',
        error,
      );
    }
  }

  // Get a person by ID
  async findOne(id: number): Promise<Person> {
    try {
      const person = await this.personRepository.findOne({ where: { id } });

      if (!person) {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }

      return person;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve person',
        error,
      );
    }
  }

  // Update a person
  async updatePerson(id: number, name: string, email: string): Promise<Person> {
    try {
      const person = await this.findOne(id);

      person.name = name || person.name;
      person.email = email || person.email;

      return await this.personRepository.save(person);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update person', error);
    }
  }

  // Delete a person
  async deletePerson(id: number): Promise<void> {
    try {
      const result = await this.personRepository.delete(id);

      if (result.affected === 0) {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete person', error);
    }
  }
}
