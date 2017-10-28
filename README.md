Right Track Database Builder
============================

**node module:** [right-track-db-build](https://www.npmjs.com/package/right-track-db-build)  
**GitHub repo:** [right-track/right-track-db-build](https://github.com/right-track/right-track-db-build)

---

This project is still being actively developed and modified.  For the more
stable previous version (shell script based), see the [dwaring87/right-track-db](https://github.com/dwaring87/right-track-db) 
project. 

### Usage

The command line utility has the following usage:

```text
Right Track DB Generator
Module: right-track-db-build
Version: 0.0.1
----------------------------
Usage:
  right-track-db-build [options] --agency <declaration> [agency options] ...
options:
  --force|-f       Force a GTFS update and database compilation
  --help|-h        Display this usage information
  --post|-p <file> Define script to run after update & compilation
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