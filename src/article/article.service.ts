import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/user/user.entity';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import { ArticleEntity } from './article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponseInterface } from './types/article-response.interface';
import slugify from 'slugify';
import { UpdateArticleDro } from './dto/update-article.dto';
import { ArticlesResponseInterface } from './types/articles-response.interface';
import { FollowEntity } from 'src/profile/follow.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  //CREATE ARTICLE
  async createArticle(
    user: UserEntity,
    dto: CreateArticleDto,
  ): Promise<ArticleEntity> {
    const article = new ArticleEntity();
    Object.assign(article, dto);

    if (!article.tagList) {
      article.tagList = [];
    }

    article.slug = this.getSlug(article.title);
    article.author = user;

    return await this.articleRepository.save(article);
  }

  // BUILD RESPONSE
  buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
    return { article };
  }

  // SLUGIFY
  getSlug(title: string): string {
    return (
      slugify(title, {
        lower: true,
      }) +
      '-' +
      ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
    );
  }

  // GET ONE BY SLUGIFY
  async getBySlug(slug: string): Promise<ArticleEntity> {
    return await this.articleRepository.findOne({ slug });
  }

  // DELETE ARTICLE
  async deleteArticle(userId: number, slug: string): Promise<DeleteResult> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    if (article.author.id !== userId) {
      throw new HttpException('You are not the author', HttpStatus.FORBIDDEN);
    }
    return await this.articleRepository.delete({ slug });
  }

  // GET ARTICLES
  async getMany(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .orderBy('articles.createdAt', 'DESC');

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    if (query.tag) {
      queryBuilder.andWhere('articles.tagList LIKE :tag', {
        tag: `%${query.tag}%`,
      });
    }

    if (query.favorited) {
      const author = await this.userRepository.findOne(
        {
          username: query.favorited,
        },
        { relations: ['favorites'] },
      );

      const ids = author.favorites.map((el) => el.id);
      if (ids.length > 0) {
        queryBuilder.andWhere('articles.id IN (:...ids)', { ids });
      } else {
        queryBuilder.andWhere('1=0');
      }
    }

    if (query.author) {
      const author = await this.userRepository.findOne({
        username: query.author,
      });

      queryBuilder.andWhere('articles.authorId = :id', {
        id: author.id,
      });
    }

    let favoriteIds: number[] = [];
    if (userId) {
      const currentUser = await this.userRepository.findOne(userId, {
        relations: ['favorites'],
      });

      favoriteIds = currentUser.favorites.map((fav) => fav.id);
    }

    const articles = await queryBuilder.getMany();
    const articlesWithFavorited = articles.map((article) => {
      const favorited = favoriteIds.includes(article.id);
      return { ...article, favorited };
    });
    const articlesCount = await queryBuilder.getCount();

    return { articles: articlesWithFavorited, articlesCount };
  }

  // GET FEED
  async getFeed(
    userId: number,
    query: any,
  ): Promise<ArticlesResponseInterface> {
    // all people we follow
    const follows = await this.followRepository.find({
      followerId: userId,
    });

    if (follows.length === 0) {
      return { articles: [], articlesCount: 0 };
    }

    //ids of all people we follow
    const followingUserIds = follows.map((follow) => follow.followingId);

    const queryBuilder = getRepository(ArticleEntity)
      .createQueryBuilder('articles')
      .leftJoinAndSelect('articles.author', 'author')
      .where('articles.authorId IN (:...ids)', { ids: followingUserIds })
      .orderBy('articles.createdAt', 'DESC');

    const articlesCount = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const articles = await queryBuilder.getMany();

    return { articles, articlesCount };
  }

  // UPDATE ARTICLE
  async updateArticle(
    userId: number,
    slug: string,
    dto: UpdateArticleDro,
  ): Promise<ArticleEntity> {
    const article = await this.articleRepository.findOne({
      where: { slug },
      relations: ['author'],
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }
    if (article.author.id !== userId) {
      throw new HttpException('You are not the author', HttpStatus.FORBIDDEN);
    }
    Object.assign(article, dto);

    return await this.articleRepository.save(article);
  }

  // LIKE ARTICLE
  async likeArticle(userId: number, slug: string): Promise<ArticleEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });

    const article = await this.articleRepository.findOne({ slug });

    const isNotFavorited =
      user.favorites.findIndex((isfav) => isfav.id === article.id) === -1;

    if (isNotFavorited) {
      user.favorites.push(article);
      article.favoritesCount++;
      await this.articleRepository.save(article);
      await this.userRepository.save(user);
    }

    return { article, user } as any;
  }

  // LIKE ARTICLE
  async dislikeArticle(userId: number, slug: string): Promise<ArticleEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favorites'],
    });

    const article = await this.articleRepository.findOne({ slug });

    const articleIndex = user.favorites.findIndex(
      (isfav) => isfav.id === article.id,
    );

    if (articleIndex >= 0) {
      user.favorites.splice(articleIndex, 1);
      article.favoritesCount--;
      await this.articleRepository.save(article);
      await this.userRepository.save(user);
    }

    return { article, user } as any;
  }
}
