import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';

/**
 * This class is used to load TypeORM entities lazily.
 */
export abstract class TypeOrmLazyInjectService implements OnModuleInit {
  private repositories: { [key: string]: Repository<unknown> };

  constructor(
    private readonly keys: string[] = [],
    ...inject: Repository<unknown>[]
  ) {
    (inject as unknown as Observable<Repository<unknown>>[]).forEach(
      (repositoryObservable, index) =>
        repositoryObservable.subscribe((repository) => {
          const repoObj = { [this.keys[index]]: repository };

          this.repositories = {
            ...this.repositories,
            ...repoObj,
          };

          Object.assign(this, repoObj);
        }),
    );
  }

  onModuleInit(): void {
    Object.assign(this, this.repositories);
  }
}
