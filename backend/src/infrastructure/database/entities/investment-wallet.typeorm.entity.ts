import { Entity, PrimaryColumn, Column, Index, OneToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('investment_wallets')
@Index(['userId'])
export class InvestmentWalletTypeOrmEntity {
  @PrimaryColumn('uuid')
  userId!: string;

  @OneToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserTypeOrmEntity;

  @Column({ type: 'bigint', default: '0', nullable: false })
  cashCents!: string;
}



