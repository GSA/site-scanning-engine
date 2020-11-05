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

  @OneToOne(() => Website)
  @JoinColumn()
  website: Website;

  @Column()
  targetUrlBaseDomain: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  finalUrl?: string;

  @Column({ nullable: true })
  finalUrlIsLive?: boolean;

  @Column({ nullable: true })
  finalUrlBaseDomain?: string;

  @Column({ nullable: true })
  finalUrlMIMEType?: string;

  @Column({ nullable: true })
  finalUrlSameDomain?: boolean;

  @Column({ nullable: true })
  finalUrlStatusCode?: number;

  @Column({ nullable: true })
  finalUrlSameWebsite?: boolean;

  @Column({ nullable: true })
  targetUrlRedirects?: boolean;
}
