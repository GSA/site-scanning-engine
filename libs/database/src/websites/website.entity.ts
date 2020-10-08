import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Website {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  agency: string;

  @Column()
  branch: string;
}
