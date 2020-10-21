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

  @ManyToOne(
    () => Website,
    website => website.id,
  )
  websiteId: number;
}
