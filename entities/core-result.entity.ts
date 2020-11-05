import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Website } from './website.entity';

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
  finalUrlMIMEType: string;

  @Column()
  finalUrlSameDomain: boolean;

  @Column()
  finalUrlStatusCode: number;

  @Column()
  finalUrlSameWebsite: boolean;

  @Column()
  targetUrlBaseDomain: string;

  @Column()
  targetUrlRedirects: boolean;

  @OneToOne(() => Website)
  @JoinColumn()
  website: Website;
}
