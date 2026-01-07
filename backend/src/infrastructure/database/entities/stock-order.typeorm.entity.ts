import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { StockTypeOrmEntity } from './stock.typeorm.entity';

export enum StockOrderSideEnum {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum StockOrderStatusEnum {
  OPEN = 'OPEN',
  PARTIALLY_FILLED = 'PARTIALLY_FILLED',
  FILLED = 'FILLED',
  CANCELLED = 'CANCELLED',
}

@Entity('stock_orders')
@Index(['stockId'])
@Index(['userId'])
@Index(['status'])
@Index(['side'])
@Index(['createdAt'])
export class StockOrderTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  stockId!: string;

  @ManyToOne(() => StockTypeOrmEntity)
  @JoinColumn({ name: 'stockId' })
  stock!: StockTypeOrmEntity;

  @Column({ type: 'enum', enum: StockOrderSideEnum, nullable: false })
  side!: StockOrderSideEnum;

  @Column({ type: 'enum', enum: StockOrderStatusEnum, default: StockOrderStatusEnum.OPEN, nullable: false })
  status!: StockOrderStatusEnum;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({ type: 'int', nullable: false })
  remainingQuantity!: number;

  @Column({ type: 'int', nullable: false })
  limitPriceCents!: number;

  @Column({ type: 'int', default: 100, nullable: false })
  feeCents!: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  feeCharged!: boolean;

  @Column({ type: 'bigint', default: '0', nullable: false })
  reservedCashCents!: string;

  @Column({ type: 'int', default: 0, nullable: false })
  reservedQuantity!: number;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt!: Date;
}



