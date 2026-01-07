import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { StockTypeOrmEntity } from './stock.typeorm.entity';
import { StockOrderTypeOrmEntity } from './stock-order.typeorm.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('stock_trades')
@Index(['stockId'])
@Index(['createdAt'])
export class StockTradeTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  stockId!: string;

  @ManyToOne(() => StockTypeOrmEntity)
  @JoinColumn({ name: 'stockId' })
  stock!: StockTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  buyOrderId!: string;

  @ManyToOne(() => StockOrderTypeOrmEntity)
  @JoinColumn({ name: 'buyOrderId' })
  buyOrder!: StockOrderTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  sellOrderId!: string;

  @ManyToOne(() => StockOrderTypeOrmEntity)
  @JoinColumn({ name: 'sellOrderId' })
  sellOrder!: StockOrderTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  buyerId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'buyerId' })
  buyer!: UserTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  sellerId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'sellerId' })
  seller!: UserTypeOrmEntity;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({ type: 'int', nullable: false })
  priceCents!: number;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt!: Date;
}



