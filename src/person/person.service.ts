import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from './person.entity';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  // Create a new person
  async createPerson(name: string, email: string): Promise<Person> {
    try {
      const existingPerson = await this.personRepository.findOne({
        where: { email },
      });

      if (existingPerson) {
        throw new ConflictException('Person with this email already exists');
      }

      const person = this.personRepository.create({ name, email });
      return await this.personRepository.save(person);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create person', error);
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
