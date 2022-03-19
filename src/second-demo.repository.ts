import { EntityRepository, Repository } from 'typeorm';

import { SecondDemo } from './second-demo.entity';

@EntityRepository(SecondDemo)
export class SecondDemoRepository extends Repository<SecondDemo> {}
