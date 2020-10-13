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
  agency: string;

  @Column()
  branch: string;
}
