import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  customerId: string;

  @Column()
  accountNumber: string;

  @Column()
  sortCode: string;

  @Column()
  accountHolderName: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verificationMethod: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'gocardless' })
  provider: string;

  @Column({ nullable: true })
  providerRef: string;

  @Column({ nullable: true })
  providerAccountId: string;

  @Column({ default: 'GBP' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
