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

## Installation

This project can be installed via `npm`:

```
npm install -g right-track-db-build
```

When installed globally, `npm` will link the executable `right-track-db-build`
into your `$PATH`.

## Dependencies

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


## Usage

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


# Additional Scripts


## Agency Scripts

Each Agency can provide scripts that override the default update script,
run after the update procedure, and run after the compilation process.



### Update Script

If this script is present, it will override the default update check script.

The default update script makes a HEAD request to the URL in the agency's
config property (`build.updateURL`).  If the Last-Modified Header is newer
than the saved date/time (or the saved date/time does not exist) then
the GTFS zip file from the URL will be downloaded and unzipped into the
`./db-build/gtfs/` directory of the agency module.

This script can be used to provide a different update and install
procedure.  The script should check if a newer GTFS source file
is available.  If an update is available, it should download and
install the GTFS files into the agency module's `./db-build/gtfs/`
directory.

**Location:** {{AGENCY_MODULE}}/db-build/src/update.js

**Parameters:**
  - `{Object} options` - The DB-Build Agency Options
  - `{function|Object} log` - The DB-Build Log functions (see `./src/helpers/log.js`)
  - `{Object} errors` - The DB-Build Error functions (see `./src/helpers/errors.js`)
  - `{function} callback` - The callback function to return to the build script
      - `{boolean} requested` - Set to `true` when a GTFS update has been requested
      - `{boolean} successful` - Set to `true` when a GTFS update has been successfully installed
      - `{string} [published]` - (optional) The date/time stamp of the GTFS published date/time.
        If not provided, this will be read from the `./db-build/gtfs/published.txt` file.
      - `{string} [notes]` - (optional) The database build notes.
        If not provided, this will be automatically generated from the compile and publish dates.



### Post-Update Script

If this script is present, it will run after the update procedure
and before the database compilation process.

This script can be used to make any agency-specific changes to the
agency's GTFS files before the database compilation begins.

**Location:** {{AGENCY_MODULE}}/db-build/src/postUpdate.js

**Parameters:**
  - `{Object} options` - The DB-Build Agency Options
  - `{function|Object} log` - The DB-Build Log functions (see `./src/helpers/log.js`)
  - `{Object} errors` - The DB-Build Error functions (see `./src/helpers/errors.js`)
  - `{function} callback` - The callback function to return to the build script (no parameters)



### Peak Calculator Script

If this script is present, it will determine if a Trip should be considered
a peak trip.  If it is a peak trip then the DB-build function will
update the value of `peak` in the `gtfs_trips` table to `1`.

**Location:** {{AGENCY_MODULE}}/db-build/src/peak.js

**Parameters:**
  - `{Object} db` - The SQLite Database instance of the database currently being built
  - `{string} tripId` - The GTFS Trip ID of the Trip to determine the peak status of
  - `{function} callback` - The callback function to return to the build script
      - `{boolean} peak` - The peak status of the Trip (`true` when peak)



### Post-Compile Script

If this script is present, it will run after the database compilation process
and before the database installation.

This script can be used to make any agency-specific changes to the compiled
Right Track database before it is installed.

**Location:** {{AGENCY_MODULE}}/db-build/src/postCompile.js

**Parameters:**
  - `{Object} options` - The DB-Build Agency Options
  - `{Object} db` - SQLite3 reference to the compiled database
  - `{function|Object} log` - The DB-Build Log functions (see `./src/helpers/log.js`)
  - `{Object} errors` - The DB-Build Error functions (see `./src/helpers/errors.js`)
  - `{function} callback` - The callback function to return to the build script (no parameters)



## Post-Install Script

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