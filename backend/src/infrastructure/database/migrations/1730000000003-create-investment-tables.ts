import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateInvestmentTables1730000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'stocks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'symbol', type: 'varchar', length: '10', isNullable: false, isUnique: true },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'isAvailable', type: 'boolean', default: true },
          { name: 'initialPriceCents', type: 'int', isNullable: false },
          { name: 'lastPriceCents', type: 'int', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('stocks', new TableIndex({ name: 'IDX_stocks_symbol', columnNames: ['symbol'] }));
    await queryRunner.createIndex('stocks', new TableIndex({ name: 'IDX_stocks_isAvailable', columnNames: ['isAvailable'] }));

    await queryRunner.createTable(
      new Table({
        name: 'investment_wallets',
        columns: [
          { name: 'userId', type: 'uuid', isPrimary: true },
          { name: 'cashCents', type: 'bigint', default: '0' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'investment_wallets',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'stock_holdings',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'stockId', type: 'uuid', isNullable: false },
          { name: 'quantity', type: 'int', default: 0 },
        ],
        uniques: [{ columnNames: ['userId', 'stockId'] }],
      }),
      true,
    );

    await queryRunner.createIndex('stock_holdings', new TableIndex({ name: 'IDX_stock_holdings_userId', columnNames: ['userId'] }));
    await queryRunner.createIndex('stock_holdings', new TableIndex({ name: 'IDX_stock_holdings_stockId', columnNames: ['stockId'] }));

    await queryRunner.createForeignKey(
      'stock_holdings',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'stock_holdings',
      new TableForeignKey({
        columnNames: ['stockId'],
        referencedTableName: 'stocks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`CREATE TYPE stock_order_side_enum AS ENUM ('BUY', 'SELL')`);
    await queryRunner.query(`CREATE TYPE stock_order_status_enum AS ENUM ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED')`);

    await queryRunner.createTable(
      new Table({
        name: 'stock_orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'uuid', isNullable: false },
          { name: 'stockId', type: 'uuid', isNullable: false },
          { name: 'side', type: 'stock_order_side_enum', isNullable: false },
          { name: 'status', type: 'stock_order_status_enum', default: "'OPEN'" },
          { name: 'quantity', type: 'int', isNullable: false },
          { name: 'remainingQuantity', type: 'int', isNullable: false },
          { name: 'limitPriceCents', type: 'int', isNullable: false },
          { name: 'feeCents', type: 'int', default: 100 },
          { name: 'feeCharged', type: 'boolean', default: false },
          { name: 'reservedCashCents', type: 'bigint', default: '0' },
          { name: 'reservedQuantity', type: 'int', default: 0 },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('stock_orders', new TableIndex({ name: 'IDX_stock_orders_stockId', columnNames: ['stockId'] }));
    await queryRunner.createIndex('stock_orders', new TableIndex({ name: 'IDX_stock_orders_userId', columnNames: ['userId'] }));
    await queryRunner.createIndex('stock_orders', new TableIndex({ name: 'IDX_stock_orders_status', columnNames: ['status'] }));
    await queryRunner.createIndex('stock_orders', new TableIndex({ name: 'IDX_stock_orders_side', columnNames: ['side'] }));
    await queryRunner.createIndex('stock_orders', new TableIndex({ name: 'IDX_stock_orders_createdAt', columnNames: ['createdAt'] }));

    await queryRunner.createForeignKey(
      'stock_orders',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'stock_orders',
      new TableForeignKey({
        columnNames: ['stockId'],
        referencedTableName: 'stocks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'stock_trades',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'stockId', type: 'uuid', isNullable: false },
          { name: 'buyOrderId', type: 'uuid', isNullable: false },
          { name: 'sellOrderId', type: 'uuid', isNullable: false },
          { name: 'buyerId', type: 'uuid', isNullable: false },
          { name: 'sellerId', type: 'uuid', isNullable: false },
          { name: 'quantity', type: 'int', isNullable: false },
          { name: 'priceCents', type: 'int', isNullable: false },
          { name: 'createdAt', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('stock_trades', new TableIndex({ name: 'IDX_stock_trades_stockId', columnNames: ['stockId'] }));
    await queryRunner.createIndex('stock_trades', new TableIndex({ name: 'IDX_stock_trades_createdAt', columnNames: ['createdAt'] }));

    await queryRunner.createForeignKey(
      'stock_trades',
      new TableForeignKey({
        columnNames: ['stockId'],
        referencedTableName: 'stocks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'stock_trades',
      new TableForeignKey({
        columnNames: ['buyOrderId'],
        referencedTableName: 'stock_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'stock_trades',
      new TableForeignKey({
        columnNames: ['sellOrderId'],
        referencedTableName: 'stock_orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'stock_trades',
      new TableForeignKey({
        columnNames: ['buyerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'stock_trades',
      new TableForeignKey({
        columnNames: ['sellerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('stock_trades', true);
    await queryRunner.dropTable('stock_orders', true);
    await queryRunner.query(`DROP TYPE IF EXISTS stock_order_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS stock_order_side_enum`);
    await queryRunner.dropTable('stock_holdings', true);
    await queryRunner.dropTable('investment_wallets', true);
    await queryRunner.dropTable('stocks', true);
  }
}



