import {MigrationInterface, QueryRunner} from "typeorm";

export class FixedUsers1629533743285 implements MigrationInterface {
    name = 'FixedUsers1629533743285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."users" ADD "username" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "public"."users" DROP COLUMN "username"`);
    }

}
