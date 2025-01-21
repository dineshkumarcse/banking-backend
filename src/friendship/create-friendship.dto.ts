import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFriendshipDto {
  @IsNumber()
  @IsNotEmpty()
  person_id: number;

  @IsNumber()
  @IsNotEmpty()
  friend_id: number;
}
