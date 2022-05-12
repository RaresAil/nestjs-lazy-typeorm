import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { TypeOrmLazyInjectService } from '../../src';

import { SecondRepository } from './second.repository';
import { First } from './first.entity';

@Injectable()
export class AppService extends TypeOrmLazyInjectService {
  constructor(
    @InjectRepository(First)
    private firstRepository: Repository<First>,
    private secondRepository: SecondRepository,
  ) {
    super(
      ['firstRepository', 'secondRepository'],
      firstRepository,
      secondRepository,
    );
  }

  async get(id: number): Promise<unknown> {
    const resultDemo = await this.firstRepository.findOne({ where: { id } });
    const resultSecondDemo = await this.secondRepository.findOne({
      where: { id },
    });

    return {
      resultDemo,
      resultSecondDemo,
    };
  }

  onModuleInit(): void {
    super.onModuleInit();
  }
}
