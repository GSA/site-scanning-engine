import { Exclude, Expose } from 'class-transformer';
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
  @Exclude({ toPlainOnly: true })
  id: number;

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  created: string;

  @UpdateDateColumn()
  @Expose({ name: 'scan_date' })
  updated: string;

  @OneToOne(() => Website, (website) => website.coreResult)
  @JoinColumn()
  @Exclude({ toPlainOnly: true })
  website: Website;

  @Column()
  @Expose({ name: 'target_url_domain' })
  targetUrlBaseDomain: string;

  @Column()
  @Expose({ name: 'scan_status' })
  status: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url' })
  finalUrl?: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_live' })
  finalUrlIsLive?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_domain' })
  finalUrlBaseDomain?: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_MIMEType' })
  finalUrlMIMEType?: string;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_same_domain' })
  finalUrlSameDomain?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_status_code' })
  finalUrlStatusCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'final_url_same_website' })
  finalUrlSameWebsite?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'target_url_404_test ' })
  targetUrl404Test?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'target_url_redirects' })
  targetUrlRedirects?: boolean;
}
