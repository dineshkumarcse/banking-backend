import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { NotFoundException } from '@nestjs/common';

@Controller('persons')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createPersons(@Body() createPersonDtos: CreatePersonDto[]) {
    return await this.personService.createPersons(createPersonDtos);
  }

  @Get()
  async getAllPersons() {
    return await this.personService.getAllPersons();
  }

  @Get(':id')
  async getPersonById(@Param('id') id: number) {
    const person = await this.personService.findOne(id);
    if (!person) {
      throw new NotFoundException('Person not found');
    }
    return person;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updatePerson(
    @Param('id') id: number,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    const { name, email } = updatePersonDto;
    return await this.personService.updatePerson(id, name, email);
  }

  @Delete(':id')
  async deletePerson(@Param('id') id: number) {
    await this.personService.deletePerson(id);
    return { message: 'Person deleted successfully' };
  }
}
