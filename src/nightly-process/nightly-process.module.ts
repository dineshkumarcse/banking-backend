// src/nightly-process/nightly-process.module.ts
import { Module } from '@nestjs/common';
import { NightlyProcessService } from './nightly-process.service';
import { ProcessModule } from '../process/process.module';
import { PersonModule } from '../person/person.module';

@Module({
  imports: [ProcessModule, PersonModule], // Import ProcessModule here
  providers: [NightlyProcessService],
  exports: [NightlyProcessService],
})
export class NightlyProcessModule {}
