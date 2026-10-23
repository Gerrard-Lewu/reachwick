# Backup and recovery

Use `npm run backup -- /absolute/private/path/reachwick.sqlite`, which uses SQLite backup support. Do not copy an open database file. Keep backups private and off-host; they contain personal data and credentials.

On Unix, new data directories are created with owner-only access, and database, WAL, shared-memory, rollback-journal, restore-temporary, and backup files are restricted to owner read/write permissions. On Windows, file access follows the parent directory's inherited ACL; keep the installation data and backup paths inside folders private to the owner account.

Stop the application before `npm run restore -- /absolute/private/path/reachwick.sqlite`. In Docker use a path inside /data, then copy the backup to private storage. Test recovery in a separate installation and back up before schema upgrades. Never commit backups.
