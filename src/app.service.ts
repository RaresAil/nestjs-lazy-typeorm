import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

import { LazyInjectService } from './lazy-typeorm/lazy-inject.service';
import { SecondDemoRepository } from './second-demo.repository';
import { Demo } from './demo.entity';

@Injectable()
export class AppService extends LazyInjectService {
  constructor(
    @InjectRepository(Demo)
    private demoRepository: Repository<Demo>,
    private secondDemoRepository: SecondDemoRepository,
  ) {
    super(
      ['demoRepository', 'secondDemoRepository'],
      demoRepository,
      secondDemoRepository,
    );
  }

  async get(id: number): Promise<unknown> {
    const resultDemo = await this.demoRepository.findOne({ where: { id } });
    const resultSecondDemo = await this.secondDemoRepository.findOne({
      where: { id },
    });
    return {
      resultDemo,
      resultSecondDemo,
    };
  }
}
