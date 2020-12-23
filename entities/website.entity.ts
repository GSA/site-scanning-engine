import { classToPlain, Exclude, Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CoreResult } from './core-result.entity';
import { SolutionsResult } from './solutions-result.entity';

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

  @OneToOne(() => CoreResult, (coreResult) => coreResult.website)
  @Exclude({ toPlainOnly: true })
  coreResult: CoreResult;

  @OneToOne(() => SolutionsResult, (solutionsResult) => solutionsResult.website)
  @Exclude({ toPlainOnly: true })
  solutionsResult: SolutionsResult;

  @Column()
  @Expose({ name: 'target_url' })
  url: string;

  @Column()
  @Expose({ name: 'target_url_branch' })
  branch: string;

  @Column()
  @Expose({ name: 'target_url_agency_owner' })
  agency: string;

  @Column({
    nullable: true,
  })
  @Expose({ name: 'target_url_agency_code' })
  agencyCode?: number;

  @Column()
  @Expose({ name: 'target_url_bureau_owner' })
  bureau: string;

  @Column({
    nullable: true,
  })
  @Expose({ name: 'target_url_bureau_code' })
  bureauCode?: number;

  serialized() {
    const serializedWebsite = classToPlain(this);
    const serializedCoreResult = classToPlain(this.coreResult);
    const serializedSolutionsResult = classToPlain(this.solutionsResult);

    const aggregate = {
      ...serializedCoreResult,
      ...serializedSolutionsResult,
      ...serializedWebsite,
    };

    return aggregate;
  }
}
