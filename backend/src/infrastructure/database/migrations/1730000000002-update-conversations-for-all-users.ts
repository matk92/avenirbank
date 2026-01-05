import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateConversationsForAllUsers1730000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "conversations" 
      ADD COLUMN IF NOT EXISTS "user1Id" uuid,
      ADD COLUMN IF NOT EXISTS "user2Id" uuid,
      ADD COLUMN IF NOT EXISTS "unreadCountUser1" integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "unreadCountUser2" integer DEFAULT 0
    `);

    await queryRunner.query(`
      UPDATE "conversations" 
      SET "user1Id" = "clientId", 
          "user2Id" = COALESCE("advisorId", "clientId"),
          "unreadCountUser1" = "unreadCount",
          "unreadCountUser2" = 0
      WHERE "user1Id" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_user1Id" ON "conversations" ("user1Id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_conversations_user2Id" ON "conversations" ("user2Id")
    `);

    await queryRunner.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "FK_conversations_user1" 
      FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE
    `).catch(() => { /* Constraint may already exist */ });

    await queryRunner.query(`
      ALTER TABLE "conversations" 
      ADD CONSTRAINT "FK_conversations_user2" 
      FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE
    `).catch(() => { /* Constraint may already exist */ });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_user1Id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_user2Id"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_user1"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_user2"`);
    await queryRunner.query(`
      ALTER TABLE "conversations" 
      DROP COLUMN IF EXISTS "user1Id",
      DROP COLUMN IF EXISTS "user2Id",
      DROP COLUMN IF EXISTS "unreadCountUser1",
      DROP COLUMN IF EXISTS "unreadCountUser2"
    `);
  }
}