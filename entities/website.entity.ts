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
  id: number;

  @CreateDateColumn()
  created: string;

  @UpdateDateColumn()
  updated: string;

  @Column()
  url: string;

  @Column()
  type: string;

  @Column()
  agency: string;

  @Column()
  organization: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  securityContactEmail: string;
}
