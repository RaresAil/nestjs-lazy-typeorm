# LazyTypeOrmModule

In order to allow the application to start without a db connection, instead of returning a connection object or a repository, it will return an observable and it will be replaced with the connection/repository when it will have a valid connection

## Installation

```bash
yarn install @raresail/nestjs-lazy-typeorm
```

```bash
npm install @raresail nestjs-lazy-typeorm
```

## Example

- forRoot and forFeature

  - `Demo` is an Entity
  - `SecondDemoRepository` is a Custom Repository

  ```typescript
  @Module({
    imports: [
      LazyTypeOrmModule.forRoot({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: '',
        database: 'lazy',
        autoLoadEntities: true,
        synchronize: true,
      }),
      LazyTypeOrmModule.forFeature([Demo, SecondDemoRepository]),
    ],
    controllers: [AppController],
    providers: [AppService],
  })
  export class AppModule {}
  ```

- In the `Service` that uses those repositories

  - The class must extend `TypeOrmLazyInjectService` which internally uses the constructor and `onModuleInit`
  - In case your service needs `onModuleInit`, you must call the `super.onModuleInit` in order to inject the correct repositories
    ```typescript
    onModuleInit(): void {
      super.onModuleInit();
    }
    ```
  - In constructor, call the super where the first parameter is an array with the variables names from the service and the rest of the parameters are the repositories. The order of the first array must match the rest params

  ```typescript
  @Injectable()
  export class AppService extends TypeOrmLazyInjectService {
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
  ```
