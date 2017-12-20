Right Track Database Builder
============================

**node module:** [right-track-db-build](https://www.npmjs.com/package/right-track-db-build)  
**GitHub repo:** [right-track/right-track-db-build](https://github.com/right-track/right-track-db-build)

---

This project is used to compile a **Right Track Database**: a SQLite database
containing GTFS transit data and additional Right Track data tables for a
single transit agency.  This database is used in the various **Right Track**
projects, such as the [right-track-server](https://github.com/right-track/right-track-server)
and is required for any data queries performed by the [right-track-core](https://github.com/right-track/right-track-core)
library.

### Installation

This project can be installed via `npm`:

```
npm install -g right-track-db-build
```

When installed globally, `npm` will link the executable `right-track-db-build`
into your `$PATH`.

### Dependencies

In order to compile a database for a specific transit agency, a **Right Track
Agency** module (such as [right-track-agency-mnr](https://github.com/right-track/right-track-agency-mnr))
will also need to be installed.  The agency module provides information on
where/how to obtain the agency's GTFS data as well as additional database
compilation instructions.  The compiled database (and an archive of compiled
databases) will be kept in the Right Track Agency's module.

The agencies are provided to the `right-track-db-build` script via the
`--agency` command line flag.

**NOTE:** There are no Right Track Agency modules listed as dependencies
in this project's `package.json` file.  The Agency modules will have
to be installed separately and referenced manually using the `--agency`
CLI flag.


### Usage

Example: Update GTFS data and compile a database for Metro North Railroad:

```
right-track-db-build --agency right-track-agency-mnr
```

The command line utility has the following usage:

```text
Right Track Database Builder
Module: right-track-db-build
Version: 1.0.0
----------------------------
Usage:
  right-track-db-build [options] --agency <declaration> [agency options] ...
options:
  --force|-f       Force a GTFS update and database compilation
  --test|-t        Test the DB compilation (does not install)
  --post|-p <file> Define a post-install script to run after update & compilation
  --help|-h        Display this usage information
  --version|-v     Display the DB Build script version
agency declaration:
  Declare an agency to check for GTFS updates/compile database.  The agency
  can be declared by module name, agency id or file path.  For example:
  --agency right-track-agency-mnr
  --agency mnr
  --agency ./path/to/right-track-agency-mnr
agency options:
  These options have to be proceeded by an agency declaration (--agency <...>)
  --config|-c <file>
     Specify the path to an optional agency configuration file
  --notes|-n <notes>
     Specify agency update notes to be included in the new database
```


### Post-Install Script

You can provide an additional post-install script via the `--post` command
line flag.

This is a JavaScript module that exports a single function.  This function takes
the following arguments:

  - `{Options}` Database Build Options
  - `{RTException[]}` List of Exceptions (Warnings & Errors) encountered during the build process
  - `{function}` Callback function called when the post-install script has finished (takes no arguments)

This script can be used to finalize the installation of the new database (ie, copy
the database to a server for distribution), send an alert of an update, etc.

**NOTE:** The Post-Install script will not run if the `--test` flag is provided.