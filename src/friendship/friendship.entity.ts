import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Person } from '../person/person.entity';

@Entity()
export class Friendship {
  @PrimaryColumn()
  person_id: number;

  @PrimaryColumn()
  friend_id: number;

  @ManyToOne(() => Person, (person) => person.friendships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'person_id', referencedColumnName: 'id' })
  person1: Person;

  @ManyToOne(() => Person, (person) => person.friendships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'friend_id', referencedColumnName: 'id' })
  person2: Person;
}
