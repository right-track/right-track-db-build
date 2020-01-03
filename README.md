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
compilation instructions.  The compiled database will be kept in the 
Right Track Agency's module.

The agencies are provided to the `right-track-db-build` script via the
`--agency` command line flag or in a configuration file.  At least one 
agency must be specified in order for the build script to run.

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
Version: 1.5.0
----------------------------
Usage:
  right-track-db-build [options] --agency <declaration> [agency options] ... [config file]

config file:
  The path to a configuration file can be used to provide the configuration options for the db build script.
  The values in the configuration file will override the default values.  Values provided as CLI arguments
  will override the default values and those in the specified configuration file (if provided).
  See the README for more detailed information about available configuration variables.

options:
  --force|-f             Force a GTFS update and database compilation
  --test|-t              Test the DB compilation (does not install)
  --post|-p <file>       Define a post-install script to run after update & compilation
  --email|-e <email>     Email address to send DB build results to
  --smtp-host <host>     SMTP server host
  --smtp-port <port>     SMTP server port
  --smtp-user <username> SMTP server username
  --smtp-pass <password> SMTP server password
  --smtp-from <name <email>>  SMTP server From address
  --smtp-secure          SMTP server use TLS
  --smtp-require-tls     SMTP server require TLS
  --help|-h              Display this usage information
  --version|-v           Display the DB Build script version

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

# Configuration

The Right Track Database builder has a number of configuration variables that can be 
specified as options at the command line or in a configuration file.  The following 
table lists all of the configuration options and their default values.

| Configuration Variable | Description | Default Value | CLI Option | Configuration File Key |
| -------- | ----------- | ---------- | -------- | ---------------------- |
| **Force** | With this option set, the build script will compile a database for all agencies, even if a GTFS update is not required. | `false` | `--force`, `-f` | `.force` | 
| **Test** | With this option set, the build script will compile a database for any agencies that require a GTFS update, but the compiled database will not be installed in the **Right Track Agency** module.  The post-install script, if provided, will not run. | `false` | `--test`, `-t` | `.test` |
| **Post-Install Script** | Provide the path to a JS file that contains a post-install script.  This script will be run after the database(s) have been compiled and installed into the **Right Track Agency** module(s).  This script can be used to finalize the installation of a new database for your specific needs.  See the **Post-Install Script** section below on how to create a post-install script. |  | `--post <file>`, `-p <file>` | `.post` |
| **AGENCY VARIABLES** |
| **Agency Declarations** | This option can be used to specify one or more **Right Track Agency** modules to be used with the build script.  At least one agency must be declared in order to run the script.  The agency can be declared by **module name** (right-track-agency-mnr), **agency id** (mnr), or **path to agency module** (/path/to/right-track-agency-mnr). | `[]` | `--agency <declaration>`, `-a <declaration>` | `.agencies[]`  **Example with just declarations:** `"agencies": ["right-track-agency-mnr", "/path/to/right-track-agency-lirr"]`.  **Example with agency config file and/or notes:** `"agencies": [{"agency": "right-track-agency-mnr", "config": "/path/to/mnr.json", "notes": "This is a test"}, {"agency": "right-track-agency-lirr", "config": "/path/to/lirr.json", "notes": "This is a test"}]` | 
| **Agency Config** | Specify the path to the agency config file to be used with the previously declared agency.  When provided as a CLI option, this option *must* be preceded by an agency declaration. | | `--config <file>`, `-c <file>` | `.agencies[].config` |
| **Agency Notes** | Use this option to override the default agency update notes added to the compiled database. | **Example:** `This schedule database was automatically compiled on 2020-1-2 01:15:01 due to a schedule data update from Metro North Railroad.` | `--notes <notes>`, `-n <notes>` | `.agencies[].notes` | 
| **EMAIL VARIABLES** |
| **Email** | When provided, this email address will be used to send summary reports to after a database has been compiled or errors occurred during the update and/or compilation process.  The following SMTP variables can be set to use an external SMTP mail server. |  | `--email <address>`, `-e <address>` | `.email` |
| **SMTP Host** | SMTP server host (is the hostname or IP address to connect to) | `localhost` | `--smtp-host <host>` | `.smtp.host` |
| **SMTP Port** | SMTP server port (is the port to connect to) | `25` | `--smtp-port <port>` | `.smtp.port` |
| **SMTP Secure** | SMTP server use TLS (if true the connection will use TLS when connecting to server. If false (the default) then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false) | `false` | `--smtp-secure` | `.smtp.secure` |
| **SMTP Require TLS** | SMTP server require TLS (if this is true and secure is false then Nodemailer tries to use STARTTLS even if the server does not advertise support for it. If the connection can not be encrypted then message is not sent) | `false` | `--smtp-require-tls` | `.smtp.requireTLS` |
| **SMTP Username** | SMTP server username |  | `--smtp-user <username>` | `.smtp.auth.user` |
| **SMTP Password** | SMTP server password |  | `--smtp-pass <password>` | `.smtp.auth.pass` |
| **SMTP From** | The 'From' address used in the summary report email | `Right Track Database Builder <user@hostname>` | `--smtp-from <name <email>>` | `.smtp.from` |

## Example Configuration File

```json
{
  "agencies": [
    "right-track-agency-mnr"
    {
      "agency": "/home/david/Documents/Development/right-track/src/agency-lirr",
      "config": "/home/david/Documents/Development/right-track/etc/lirr.json",
      "notes": "This is a test"
    }
  ],
  "email": "reports@righttrack.io",
  "smtp": {
    "host": "email.server.com",
    "port": 587,
    "secure": false,
    "requireTLS": true,
    "auth": {
      "user": "username",
      "pass": "password"
    },
    "from": "Right Track Database Builder <reports@righttrack.io>"
  }
}
```

Any CLI options will override the defaults and any found in the config file, provided.


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
a peak trip (ie, operates during agency-specified rush hours and has higher
than usual fares).  By default the DB-Build script will mark all Trips as
not peak (value of `0`).  This script should return a peak status value
for the specified Trip with one of these possible values:

- `0` - the Trip is never considered a Peak trip
- `1` - the Trip is always considered a Peak trip when it runs (excluding
Holidays that do not have Peak trips)
- `2` - the Trip may be considered a Peak trip, if the date of the Trip
is a weekday (excluding Holidays that do not have Peak trips)

When the `right-track-core` library creates a `Trip` instance, it will consult
the `rt_holidays` table, if present.  If a `Trip` is being created for a date
that is considered a Holiday and the holiday has a `peak` value of `false`, then
all Trips running on that date will be considered Off-Peak.

**Location:** {{AGENCY_MODULE}}/db-build/src/peak.js

**Parameters:**
  - `{Object} db` - The SQLite Database instance of the database currently being built
  - `{string} tripId` - The GTFS Trip ID of the Trip to determine the peak status of
  - `{function} callback` - The callback function to return to the build script
      - `{int} peak` - The peak status of the Trip



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