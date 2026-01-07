import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('stocks')
@Unique(['symbol'])
@Index(['symbol'])
@Index(['isAvailable'])
export class StockTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  symbol!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'boolean', default: true, nullable: false })
  isAvailable!: boolean;

  @Column({ type: 'int', nullable: false })
  initialPriceCents!: number;

  @Column({ type: 'int', nullable: false })
  lastPriceCents!: number;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt!: Date;
}



