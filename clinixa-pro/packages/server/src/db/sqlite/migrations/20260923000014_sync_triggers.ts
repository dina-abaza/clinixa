import type { Knex } from 'knex';

const patientBranch = "COALESCE((SELECT home_branch_id FROM patients WHERE id = NEW.patient_id), (SELECT b.id FROM branches b ORDER BY b.created_at LIMIT 1))";
const oldPatientBranch = "COALESCE((SELECT home_branch_id FROM patients WHERE id = OLD.patient_id), (SELECT b.id FROM branches b ORDER BY b.created_at LIMIT 1))";
const followUpBranch = "COALESCE(NEW.branch_id, (SELECT b.id FROM branches b ORDER BY b.created_at LIMIT 1))";
const oldFollowUpBranch = "COALESCE(OLD.branch_id, (SELECT b.id FROM branches b ORDER BY b.created_at LIMIT 1))";
const prescriptionBranch = "COALESCE((SELECT home_branch_id FROM patients p JOIN prescriptions pr ON pr.patient_id = p.id WHERE pr.id = NEW.prescription_id), (SELECT b.id FROM branches b ORDER BY b.created_at LIMIT 1))";
const oldPrescriptionBranch = "COALESCE((SELECT home_branch_id FROM patients p JOIN prescriptions pr ON pr.patient_id = p.id WHERE pr.id = OLD.prescription_id), (SELECT b.id FROM branches b ORDER BY b.created_at LIMIT 1))";

const syncTables: Array<{ name: string; branchExpression: string; oldBranchExpression: string }> = [
  { name: 'patients', branchExpression: 'COALESCE(NEW.home_branch_id, (SELECT id FROM branches ORDER BY created_at LIMIT 1))', oldBranchExpression: 'COALESCE(OLD.home_branch_id, (SELECT id FROM branches ORDER BY created_at LIMIT 1))' },
  { name: 'patient_emergency_contacts', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'patient_follow_ups', branchExpression: followUpBranch, oldBranchExpression: oldFollowUpBranch },
  { name: 'medical_alerts', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'medical_history', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'diagnoses', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'medications', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'prescriptions', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'prescription_items', branchExpression: prescriptionBranch, oldBranchExpression: oldPrescriptionBranch },
  { name: 'labs', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'radiology', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'documents', branchExpression: patientBranch, oldBranchExpression: oldPatientBranch },
  { name: 'attendance', branchExpression: 'NEW.branch_id', oldBranchExpression: 'OLD.branch_id' },
  { name: 'charges', branchExpression: 'NEW.branch_id', oldBranchExpression: 'OLD.branch_id' },
  { name: 'payments', branchExpression: 'NEW.branch_id', oldBranchExpression: 'OLD.branch_id' },
  { name: 'inventory_items', branchExpression: 'NEW.branch_id', oldBranchExpression: 'OLD.branch_id' },
  { name: 'branches', branchExpression: 'NEW.id', oldBranchExpression: 'OLD.id' },
];

/** @description إنشاء SQLite triggers لتسجيل كل تغيير قابل للمزامنة كـ pointer */
export async function up(knex: Knex): Promise<void> {
  for (const table of syncTables) {
    await knex.raw(`
      CREATE TRIGGER sync_${table.name}_insert
      AFTER INSERT ON ${table.name}
      BEGIN
        INSERT INTO sync_outbox (id, table_name, record_id, branch_id, status, attempts, last_error, created_at, updated_at, synced_at)
        VALUES ('sync_' || lower(hex(randomblob(16))), '${table.name}', NEW.id, ${table.branchExpression}, 'pending', 0, NULL, datetime('now'), datetime('now'), NULL)
        ON CONFLICT(table_name, record_id) DO UPDATE SET branch_id = excluded.branch_id, status = 'pending', updated_at = datetime('now'), last_error = NULL;
      END;
    `);
    await knex.raw(`
      CREATE TRIGGER sync_${table.name}_update
      AFTER UPDATE ON ${table.name}
      BEGIN
        INSERT INTO sync_outbox (id, table_name, record_id, branch_id, status, attempts, last_error, created_at, updated_at, synced_at)
        VALUES ('sync_' || lower(hex(randomblob(16))), '${table.name}', NEW.id, ${table.branchExpression}, 'pending', 0, NULL, datetime('now'), datetime('now'), NULL)
        ON CONFLICT(table_name, record_id) DO UPDATE SET branch_id = excluded.branch_id, status = 'pending', updated_at = datetime('now'), last_error = NULL;
      END;
    `);
    await knex.raw(`
      CREATE TRIGGER sync_${table.name}_delete
      AFTER DELETE ON ${table.name}
      BEGIN
        INSERT INTO sync_outbox (id, table_name, record_id, branch_id, status, attempts, last_error, created_at, updated_at, synced_at)
        VALUES ('sync_' || lower(hex(randomblob(16))), '${table.name}', OLD.id, ${table.oldBranchExpression}, 'pending', 0, NULL, datetime('now'), datetime('now'), NULL)
        ON CONFLICT(table_name, record_id) DO UPDATE SET branch_id = excluded.branch_id, status = 'pending', updated_at = datetime('now'), last_error = NULL;
      END;
    `);
  }
}

/** @description حذف SQLite triggers الخاصة بالمزامنة */
export async function down(knex: Knex): Promise<void> {
  for (const table of syncTables) {
    await knex.raw(`DROP TRIGGER IF EXISTS sync_${table.name}_insert`);
    await knex.raw(`DROP TRIGGER IF EXISTS sync_${table.name}_update`);
    await knex.raw(`DROP TRIGGER IF EXISTS sync_${table.name}_delete`);
  }
}