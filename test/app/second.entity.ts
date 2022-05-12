import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Second {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  second: string;
}
