import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('savings_rates')
export class SavingsRateTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('decimal', {
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  rate!: number;

  @Column('timestamp')
  effectiveDate!: Date;

  @Column('uuid')
  setBy!: string;

  @CreateDateColumn()
  createdAt!: Date;
}