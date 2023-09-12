import { classToPlain, Exclude, Expose, Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CoreResult } from './core-result.entity';

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

  @OneToOne(() => CoreResult, (coreResult) => coreResult.website, {
    onDelete: 'CASCADE',
  })
  @Exclude({ toPlainOnly: true })
  coreResult: CoreResult;

  @Column()
  @Expose({ name: 'target_url' })
  url: string;

  @Column({ nullable: true })
  @Expose({ name: 'target_url_top_level_domain' })
  topLevelDomain: string;

  @Column()
  @Expose({ name: 'target_url_branch' })
  branch: string;

  @Column()
  @Expose({ name: 'target_url_agency_owner' })
  agency: string;

  @Column({
    nullable: true,
  })
  @Exclude()
  agencyCode?: number;

  @Column()
  @Expose({ name: 'target_url_bureau_owner' })
  bureau: string;

  @Column({
    nullable: true,
  })
  @Exclude()
  bureauCode?: number;

  @Column({ nullable: true })
  @Expose({ name: 'source_list' })
  @Transform((value: string) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  sourceList?: string;

  serialized() {
    const serializedWebsite = classToPlain(this);
    const serializedCoreResult = classToPlain(this.coreResult);

    const aggregate = {
      ...serializedCoreResult,
      ...serializedWebsite,
    };

    return aggregate;
  }

  static getColumnNames(): string[] {
    // return class-transformer version of column names
    return Object.keys(classToPlain(new Website()));
  }
}
