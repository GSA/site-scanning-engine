import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CoreResult {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: string;

  @UpdateDateColumn()
  updated: string;

  @Column()
  targetUrl: string;

  @Column()
  finalUrl: string;

  @Column()
  agency: string;

  @Column()
  branch: string;
}
