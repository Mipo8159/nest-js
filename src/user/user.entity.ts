import { hash } from 'bcrypt';
import { ArticleEntity } from 'src/article/article.entity';
import {
  BeforeInsert,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: '' })
  bio: string;

  @Column({ default: '' })
  img: string;

  @Column({ select: false })
  password: string;

  @BeforeInsert()
  async hashed() {
    this.password = await hash(this.password, 10);
  }

  @OneToMany(() => ArticleEntity, (articles) => articles.author)
  articles: ArticleEntity[];

  @ManyToMany(() => ArticleEntity)
  @JoinTable()
  favorites: ArticleEntity[];
}
