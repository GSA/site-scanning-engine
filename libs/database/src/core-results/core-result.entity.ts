import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
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

  @ManyToOne(
    () => Website,
    website => website.id,
  )
  website: number;
}
