import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Website {
  @PrimaryGeneratedColumn()
  @Exclude({ toPlainOnly: true })
  id: number;

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  created: string;

  @UpdateDateColumn()
  @Exclude({ toPlainOnly: true })
  updated: string;

  @Column()
  @Expose({ name: 'target_url' })
  url: string;

  @Column()
  @Expose({ name: 'target_url_branch' })
  type: string;

  @Column()
  @Expose({ name: 'target_url_agency_owner' })
  agency: string;

  @Column()
  @Expose({ name: 'target_url_bureau_owner' })
  organization: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  city: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  state: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  securityContactEmail: string;
}
