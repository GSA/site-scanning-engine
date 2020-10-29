import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Website } from '../websites/website.entity';

@Entity()
export class CoreResult {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  created: string;

  @UpdateDateColumn()
  updated: string;

  @Column()
  finalUrl: string;

  @Column()
  finalUrlIsLive: boolean;

  @Column()
  finalUrlBaseDomain: string;

  @Column()
  targetUrlRedirects: boolean;

  @OneToOne(() => Website)
  @JoinColumn()
  website: Website;
}
