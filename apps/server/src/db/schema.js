import db from './index.js'

export async function initSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('receptionist', 'assistant', 'director')),
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      species TEXT NOT NULL CHECK(species IN ('dog', 'cat', 'other')),
      breed TEXT,
      gender TEXT CHECK(gender IN ('male', 'female', 'unknown')),
      birth_date TEXT,
      weight REAL,
      color TEXT,
      microchip_id TEXT,
      neutered BOOLEAN DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vaccines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      manufacturer TEXT,
      type TEXT NOT NULL,
      dose_volume REAL,
      applicable_species TEXT,
      interval_days INTEGER,
      booster_doses INTEGER,
      storage_condition TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vaccine_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaccine_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL UNIQUE,
      manufacture_date TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      used_quantity INTEGER NOT NULL DEFAULT 0,
      unit_price REAL,
      supplier TEXT,
      lot_number TEXT,
      status TEXT NOT NULL DEFAULT 'normal' CHECK(status IN ('normal', 'quarantine', 'recalled', 'expired')),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vaccine_id) REFERENCES vaccines(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      vaccine_id INTEGER,
      appointment_type TEXT NOT NULL CHECK(appointment_type IN ('vaccination', 'recheck', 'consultation')),
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'checked_in', 'completed', 'cancelled', 'no_show')),
      checkin_time TEXT,
      checkout_time TEXT,
      assigned_user_id INTEGER,
      notes TEXT,
      cancel_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (owner_id) REFERENCES owners(id),
      FOREIGN KEY (vaccine_id) REFERENCES vaccines(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      checkin_time TEXT NOT NULL,
      temperature REAL,
      weight REAL,
      heart_rate INTEGER,
      respiratory_rate INTEGER,
      general_condition TEXT,
      checked_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (owner_id) REFERENCES owners(id),
      FOREIGN KEY (checked_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contraindications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      checkin_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('allergy', 'illness', 'pregnancy', 'immunocompromised', 'other')),
      description TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('mild', 'moderate', 'severe')),
      onset_date TEXT,
      resolved BOOLEAN DEFAULT 0,
      resolution_date TEXT,
      noted_by INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (checkin_id) REFERENCES checkins(id),
      FOREIGN KEY (noted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS vaccination_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL,
      checkin_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      vaccine_batch_id INTEGER NOT NULL,
      vaccine_id INTEGER NOT NULL,
      administration_date TEXT NOT NULL,
      administration_site TEXT,
      dose_volume REAL,
      given_by INTEGER NOT NULL,
      next_due_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id),
      FOREIGN KEY (checkin_id) REFERENCES checkins(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (vaccine_batch_id) REFERENCES vaccine_batches(id),
      FOREIGN KEY (vaccine_id) REFERENCES vaccines(id),
      FOREIGN KEY (given_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS revisit_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pet_id INTEGER NOT NULL,
      vaccination_record_id INTEGER,
      reminder_date TEXT NOT NULL,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('booster', 'recheck', 'annual')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'completed', 'cancelled')),
      sent_at TEXT,
      sent_by INTEGER,
      response TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (vaccination_record_id) REFERENCES vaccination_records(id),
      FOREIGN KEY (sent_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS adverse_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vaccination_record_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      reaction_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
      onset_time TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      treatment_provided TEXT,
      follow_up_required BOOLEAN DEFAULT 0,
      follow_up_date TEXT,
      reported_by INTEGER,
      resolved BOOLEAN DEFAULT 0,
      resolution_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vaccination_record_id) REFERENCES vaccination_records(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (reported_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follow_up_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adverse_reaction_id INTEGER,
      revisit_reminder_id INTEGER,
      pet_id INTEGER NOT NULL,
      call_type TEXT NOT NULL CHECK(call_type IN ('adverse_reaction', 'revisit_reminder', 'general')),
      call_date TEXT NOT NULL,
      caller_id INTEGER,
      call_result TEXT NOT NULL,
      response_details TEXT,
      follow_up_action TEXT,
      next_call_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (adverse_reaction_id) REFERENCES adverse_reactions(id),
      FOREIGN KEY (revisit_reminder_id) REFERENCES revisit_reminders(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id),
      FOREIGN KEY (caller_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_pet ON appointments(pet_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_vaccine_batches_vaccine ON vaccine_batches(vaccine_id);
    CREATE INDEX IF NOT EXISTS idx_vaccine_batches_status ON vaccine_batches(status);
    CREATE INDEX IF NOT EXISTS idx_revisit_reminders_date ON revisit_reminders(reminder_date);
    CREATE INDEX IF NOT EXISTS idx_revisit_reminders_status ON revisit_reminders(status);
    CREATE INDEX IF NOT EXISTS idx_contraindications_pet ON contraindications(pet_id);
    CREATE INDEX IF NOT EXISTS idx_adverse_reactions_pet ON adverse_reactions(pet_id);
  `)
}
