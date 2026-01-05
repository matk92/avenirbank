import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMessagingTables1730000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE conversation_status_enum AS ENUM ('pending', 'active', 'closed')`);

    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'clientId', type: 'uuid', isNullable: false },
          { name: 'advisorId', type: 'uuid', isNullable: true },
          { name: 'status', type: 'conversation_status_enum', default: "'pending'" },
          { name: 'unreadCount', type: 'int', default: 0 },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'transferredAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true
    );

    await queryRunner.createIndex('conversations', new TableIndex({ columnNames: ['clientId'] }));
    await queryRunner.createIndex('conversations', new TableIndex({ columnNames: ['advisorId'] }));
    await queryRunner.createIndex('conversations', new TableIndex({ columnNames: ['status'] }));

    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['clientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'conversations',
      new TableForeignKey({
        columnNames: ['advisorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'conversationId', type: 'uuid', isNullable: false },
          { name: 'senderId', type: 'uuid', isNullable: false },
          { name: 'senderName', type: 'varchar', length: '100' },
          { name: 'senderRole', type: 'enum', enum: ['CLIENT', 'ADVISOR', 'DIRECTOR'] },
          { name: 'content', type: 'text' },
          { name: 'read', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createIndex('messages', new TableIndex({ columnNames: ['conversationId'] }));
    await queryRunner.createIndex('messages', new TableIndex({ columnNames: ['senderId'] }));
    await queryRunner.createIndex('messages', new TableIndex({ columnNames: ['createdAt'] }));

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['conversationId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'conversations',
        onDelete: 'CASCADE',
      })
    );
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['senderId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'recipientId', type: 'uuid', isNullable: false },
          { name: 'message', type: 'text' },
          { name: 'read', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createIndex('notifications', new TableIndex({ columnNames: ['recipientId'] }));
    await queryRunner.createIndex('notifications', new TableIndex({ columnNames: ['read'] }));
    await queryRunner.createIndex('notifications', new TableIndex({ columnNames: ['createdAt'] }));

    await queryRunner.createForeignKey(
      'notifications',
      new TableForeignKey({
        columnNames: ['recipientId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'activities',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'title', type: 'varchar', length: '255' },
          { name: 'description', type: 'text' },
          { name: 'authorId', type: 'uuid', isNullable: false },
          { name: 'authorName', type: 'varchar', length: '100' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createIndex('activities', new TableIndex({ columnNames: ['authorId'] }));
    await queryRunner.createIndex('activities', new TableIndex({ columnNames: ['createdAt'] }));

    await queryRunner.createForeignKey(
      'activities',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'group_messages',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'room', type: 'varchar', length: '100' },
          { name: 'authorId', type: 'uuid', isNullable: false },
          { name: 'authorName', type: 'varchar', length: '100' },
          { name: 'authorRole', type: 'enum', enum: ['CLIENT', 'ADVISOR', 'DIRECTOR'] },
          { name: 'content', type: 'text' },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true
    );

    await queryRunner.createIndex('group_messages', new TableIndex({ columnNames: ['room'] }));
    await queryRunner.createIndex('group_messages', new TableIndex({ columnNames: ['createdAt'] }));

    await queryRunner.createForeignKey(
      'group_messages',
      new TableForeignKey({
        columnNames: ['authorId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('group_messages');
    await queryRunner.dropTable('activities');
    await queryRunner.dropTable('notifications');
    await queryRunner.dropTable('messages');
    await queryRunner.dropTable('conversations');
    await queryRunner.query(`DROP TYPE conversation_status_enum`);
  }
}