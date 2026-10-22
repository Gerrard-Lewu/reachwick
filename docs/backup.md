# Backup and recovery

Use `npm run backup -- /absolute/private/path/reachwick.sqlite`, which uses SQLite backup support. Do not copy an open database file. Keep backups private and off-host; they contain personal data and credentials.

Stop the application before `npm run restore -- /absolute/private/path/reachwick.sqlite`. In Docker use a path inside /data, then copy the backup to private storage. Test recovery in a separate installation and back up before schema upgrades. Never commit backups.
