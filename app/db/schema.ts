export const schema = `
CREATE TABLE IF NOT EXISTS exhibits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  era TEXT,
  material TEXT,
  dimensions TEXT,
  weight TEXT,
  description TEXT,
  condition TEXT,
  storage_location TEXT,
  value TEXT,
  insurance_info TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loan_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exhibit_id INTEGER NOT NULL,
  exhibit_name TEXT NOT NULL,
  applicant_id INTEGER NOT NULL,
  applicant_name TEXT NOT NULL,
  borrowing_institution TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  exhibition_name TEXT NOT NULL,
  exhibition_location TEXT NOT NULL,
  purpose TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  current_stage TEXT DEFAULT 'application',
  priority TEXT DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exhibit_id) REFERENCES exhibits(id),
  FOREIGN KEY (applicant_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conservation_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  reviewer_name TEXT NOT NULL,
  temperature_requirement TEXT,
  humidity_requirement TEXT,
  light_requirement TEXT,
  packaging_requirement TEXT,
  special_requirements TEXT,
  condition_assessment TEXT,
  risks TEXT,
  recommendations TEXT,
  approved BOOLEAN DEFAULT 0,
  review_date DATETIME,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS transport_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  transport_type TEXT NOT NULL,
  carrier TEXT,
  vehicle_number TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  departure_location TEXT,
  destination TEXT,
  scheduled_departure DATETIME,
  scheduled_arrival DATETIME,
  actual_departure DATETIME,
  actual_arrival DATETIME,
  escort_name TEXT,
  escort_phone TEXT,
  security_measures TEXT,
  status TEXT DEFAULT 'scheduled',
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id)
);

CREATE TABLE IF NOT EXISTS inspection_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  inspector_id INTEGER NOT NULL,
  inspector_name TEXT NOT NULL,
  inspection_date DATETIME NOT NULL,
  temperature TEXT,
  humidity TEXT,
  condition_status TEXT,
  display_check TEXT,
  security_check TEXT,
  environment_check TEXT,
  findings TEXT,
  recommendations TEXT,
  photos TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (inspector_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS return_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  handler_id INTEGER NOT NULL,
  handler_name TEXT NOT NULL,
  return_date DATETIME NOT NULL,
  return_location TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  package_condition TEXT,
  overall_condition TEXT,
  items_checked TEXT,
  discrepancies TEXT,
  signatures TEXT,
  photos TEXT,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (handler_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS damage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exhibit_id INTEGER NOT NULL,
  loan_id INTEGER,
  reporter_id INTEGER NOT NULL,
  reporter_name TEXT NOT NULL,
  discovery_date DATETIME NOT NULL,
  damage_location TEXT,
  damage_type TEXT,
  damage_severity TEXT,
  description TEXT NOT NULL,
  cause TEXT,
  immediate_actions TEXT,
  photos TEXT,
  status TEXT DEFAULT 'reported',
  repair_plan TEXT,
  estimated_cost TEXT,
  repair_status TEXT,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exhibit_id) REFERENCES exhibits(id),
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stage_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  operator_id INTEGER NOT NULL,
  operator_name TEXT NOT NULL,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (operator_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER,
  exhibit_id INTEGER,
  reporter_id INTEGER NOT NULL,
  reporter_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to_id INTEGER,
  assigned_to_name TEXT,
  resolution TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (loan_id) REFERENCES loan_applications(id),
  FOREIGN KEY (exhibit_id) REFERENCES exhibits(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);
`;
