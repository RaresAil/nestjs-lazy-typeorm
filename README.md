# LazyTypeOrmModule

In order to allow the application to start without a db connection, instead of returning a connection object or a repository, it will return an observable and it will be replaced with the connection/repository when it will have a valid connection

## Installation

```bash
yarn install nestjs-lazy-typeorm

npm install nestjs-lazy-typeorm
```
