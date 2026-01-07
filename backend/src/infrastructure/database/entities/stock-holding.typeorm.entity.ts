import { Entity, PrimaryColumn, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { StockTypeOrmEntity } from './stock.typeorm.entity';

@Entity('stock_holdings')
@Unique(['userId', 'stockId'])
@Index(['userId'])
@Index(['stockId'])
export class StockHoldingTypeOrmEntity {
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

  @Column({ type: 'int', default: 0, nullable: false })
  quantity!: number;
}



