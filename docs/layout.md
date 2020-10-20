## Layout
The project is laid out into serveral related components. These components can be thought of as either "applications" or "libraries". 

### Applications
"Applications" have a `main.js` and are meant to be executables. These are found in the [apps](./apps) directory.

The current applications are:
1) [The Site Scanner](../apps/scanner) which is responsible for scanning and scan logic. 
2) [The  Producer](../apps/producer) which is responsible for creating work for the Site Scanner application.
3) [The API](../apps/api) which is responsible for managing HTTPS access to the data.

See each the applications' `README.md`s for more info.

#### Adding a new application
To add a new application, use the Nest.js CLI to scaffold the application. 

`nest g app <app_name>`

### Libraries
"Libraries" have an `index.js` and are meant to be used by "Applications". Anything that will be used by multiple "Applications" should likely be a library.

The current libraries are:
1) [Database](../libs/database) which is responsible for all data access. 
2) [Message Queue](../libs/message-queue) which is responsible for handling the message queue.
3) [Logger](../libs/logger) which is responsible for handling application logging.

#### Adding a new Library
To add a new library, use the Nest.js CLI to scaffold the library.

`nest g library <library_name>`


