import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMessageGroups1730000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'message_groups',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: '120', isNullable: false },
          { name: 'createdById', type: 'uuid', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('message_groups', new TableIndex({ columnNames: ['updatedAt'] }));

    await queryRunner.createForeignKey(
      'message_groups',
      new TableForeignKey({
        columnNames: ['createdById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'message_group_members',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'groupId', type: 'uuid', isNullable: false },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'lastReadAt', type: 'timestamp', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('message_group_members', new TableIndex({ columnNames: ['groupId'] }));
    await queryRunner.createIndex('message_group_members', new TableIndex({ columnNames: ['userId'] }));
    await queryRunner.createIndex(
      'message_group_members',
      new TableIndex({ name: 'IDX_message_group_members_group_user', columnNames: ['groupId', 'userId'], isUnique: true }),
    );

    await queryRunner.createForeignKey(
      'message_group_members',
      new TableForeignKey({
        columnNames: ['groupId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'message_groups',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'message_group_members',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_group_members');
    await queryRunner.dropTable('message_groups');
  }
}