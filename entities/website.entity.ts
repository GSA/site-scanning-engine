import { Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CoreResult } from './core-result.entity';
import { UswdsResult } from './uswds-result.entity';

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

  @OneToOne(
    () => CoreResult,
    coreResult => coreResult.website,
  )
  @Exclude({ toPlainOnly: true })
  coreResult: CoreResult;

  @OneToOne(
    () => UswdsResult,
    uswdsResult => uswdsResult.website,
  )
  @Exclude({ toPlainOnly: true })
  uswdsResult: UswdsResult;

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
