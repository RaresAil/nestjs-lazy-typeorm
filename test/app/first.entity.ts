import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class First {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
