import { EntityRepository, Repository } from 'typeorm';

import { Second } from './second.entity';

@EntityRepository(Second)
export class SecondRepository extends Repository<Second> {}
