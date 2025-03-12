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
  @Expose({ name: 'initial_domain' })
  url: string;

  @Column({ nullable: true })
  @Expose({ name: 'initial_top_level_domain' })
  topLevelDomain: string;

  @Column()
  @Expose({ name: 'branch' })
  branch: string;

  @Column()
  @Expose({ name: 'agency' })
  agency: string;

  @Column()
  @Expose({ name: 'bureau' })
  bureau: string;

  @Column({ nullable: true })
  @Expose({ name: 'source_list' })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      return value.split(',');
    } else {
      return null;
    }
  })
  sourceList?: string;

  @Column({ nullable: true })
  @Expose({ name: 'public' })
  ombIdeaPublic?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'filter' })
  filter?: boolean;

  @Column({ nullable: true })
  @Expose({ name: 'pageviews' })
  pageviews?: number;

  @Column({ nullable: true })
  @Expose({ name: 'visits' })
  visits?: number;

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
