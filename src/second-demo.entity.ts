import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SecondDemo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  second: string;
}
