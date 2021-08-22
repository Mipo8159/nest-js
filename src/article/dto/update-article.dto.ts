import { IsNotEmpty } from 'class-validator';

export class UpdateArticleDro {
  @IsNotEmpty()
  readonly title: string;

  @IsNotEmpty()
  readonly body: string;

  @IsNotEmpty()
  readonly description: string;

  readonly taglist?: string[];
}
