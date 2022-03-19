# LazyTypeOrmModule

In order to allow the app to start without a db connection, instead of returning a connection object or a repository, it will return an observable which will return the connection/repository when it will be connected
