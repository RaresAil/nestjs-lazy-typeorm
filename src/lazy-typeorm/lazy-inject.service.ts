import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';

export abstract class LazyInjectService implements OnModuleInit {
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

  onModuleInit() {
    Object.assign(this, this.repositories);
  }
}
