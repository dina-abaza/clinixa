const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'clinixa.db');
const db = new Database(dbPath);

const branch = db.prepare('SELECT id FROM branches LIMIT 1').get();

if (!branch) {
  console.log('No branch exists. Run first-run first.');
  process.exit(1);
}

const row = {
  id: 'sync_manual_probe_001',
  table_name: 'patients',
  record_id: 'pat_probe_001',
  branch_id: branch.id,
  status: 'pending',
  attempts: 0,
  last_error: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  synced_at: null,
};

db.prepare(`
  INSERT INTO sync_outbox (
    id,
    table_name,
    record_id,
    branch_id,
    status,
    attempts,
    last_error,
    created_at,
    updated_at,
    synced_at
  )
  VALUES (
    $id,
    $table_name,
    $record_id,
    $branch_id,
    $status,
    $attempts,
    $last_error,
    $created_at,
    $updated_at,
    $synced_at
  )
`).run(row);

const pending = db
  .prepare(`
    SELECT COUNT(*) AS total
    FROM sync_outbox
    WHERE status = 'pending'
  `)
  .get();

console.log(
  JSON.stringify(
    {
      inserted: row.id,
      pending_count: pending.total,
      branch_id: branch.id,
    },
    null,
    2
  )
);

db.close();
