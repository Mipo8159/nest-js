import { UserType } from './user.type';

export class UserResponseInterface {
  user: UserType & { token: string };
}
