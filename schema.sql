-- ============================================================
-- RURAL PORTAL v2 — MySQL Schema
-- New in v2: work_updates, work_update_photos,
--            ai_severity_score, anonymous mode, budget_estimate
-- ============================================================

CREATE DATABASE IF NOT EXISTS rural_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rural_portal;

-- ── Users ─────────────────────────────────────────────────────
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL UNIQUE,
  password       VARCHAR(255)  NOT NULL,
  phone          VARCHAR(15)   DEFAULT NULL,
  state          VARCHAR(100)  NOT NULL,
  district       VARCHAR(100)  NOT NULL,
  village        VARCHAR(150)  NOT NULL,
  role           ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  anonymous_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email    (email),
  INDEX idx_role     (role),
  INDEX idx_state    (state),
  INDEX idx_district (district)
) ENGINE=InnoDB;

-- ── Categories ────────────────────────────────────────────────
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  icon        VARCHAR(50)  NOT NULL DEFAULT 'alert-circle',
  color       VARCHAR(20)  NOT NULL DEFAULT '#4CAF50',
  description TEXT         DEFAULT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO categories (name, icon, color, description) VALUES
  ('Water Supply',      'droplets',    '#2196F3', 'Drinking water, irrigation, drainage'),
  ('Roads & Transport', 'road',        '#FF9800', 'Potholes, damaged roads, connectivity'),
  ('Electricity',       'zap',         '#FFC107', 'Power outages, transformers, lighting'),
  ('Healthcare',        'heart-pulse', '#F44336', 'Hospital access, medicines, sanitation'),
  ('Education',         'book-open',   '#9C27B0', 'School infrastructure, teachers'),
  ('Agriculture',       'wheat',       '#4CAF50', 'Crop damage, irrigation, fertilisers'),
  ('Sanitation',        'trash-2',     '#795548', 'Waste disposal, drainage clogging'),
  ('Connectivity',      'signal',      '#607D8B', 'Mobile network, internet, broadband'),
  ('Public Safety',     'shield-alert','#E91E63', 'Crime, animal attacks, disasters'),
  ('Govt Schemes',      'landmark',    '#00BCD4', 'Scheme delivery, corruption');

-- ── Problems ──────────────────────────────────────────────────
CREATE TABLE problems (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT UNSIGNED NOT NULL,
  category_id             INT UNSIGNED NOT NULL,
  title                   VARCHAR(255) NOT NULL,
  description             TEXT         NOT NULL,
  anonymous               BOOLEAN NOT NULL DEFAULT FALSE,
  -- Groq AI fields
  ai_summary              TEXT         DEFAULT NULL,
  ai_severity_score       TINYINT UNSIGNED DEFAULT NULL,
  ai_tags                 VARCHAR(500) DEFAULT NULL,
  ai_responsible_dept     VARCHAR(150) DEFAULT NULL,
  ai_resolution_days      SMALLINT UNSIGNED DEFAULT NULL,
  -- Location
  state                   VARCHAR(100) NOT NULL,
  district                VARCHAR(100) NOT NULL,
  village                 VARCHAR(150) NOT NULL,
  pincode                 VARCHAR(10)  DEFAULT NULL,
  latitude                DECIMAL(10,8) DEFAULT NULL,
  longitude               DECIMAL(11,8) DEFAULT NULL,
  -- Status
  status                  ENUM('pending','in_review','in_progress','resolved','rejected') NOT NULL DEFAULT 'pending',
  priority                ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  admin_notes             TEXT         DEFAULT NULL,
  budget_estimate         DECIMAL(12,2) DEFAULT NULL,
  -- Metrics
  upvotes                 INT UNSIGNED NOT NULL DEFAULT 0,
  views                   INT UNSIGNED NOT NULL DEFAULT 0,
  work_updates_count      INT UNSIGNED NOT NULL DEFAULT 0,
  avg_work_completion     DECIMAL(5,2) DEFAULT NULL,
  -- Timestamps
  resolved_at             TIMESTAMP    DEFAULT NULL,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_prob_user FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_prob_cat  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,

  INDEX idx_p_user      (user_id),
  INDEX idx_p_cat       (category_id),
  INDEX idx_p_status    (status),
  INDEX idx_p_severity  (ai_severity_score DESC),
  INDEX idx_p_state     (state),
  INDEX idx_p_district  (district),
  INDEX idx_p_created   (created_at DESC),
  FULLTEXT idx_p_search (title, description)
) ENGINE=InnoDB;

-- ── Problem photos ────────────────────────────────────────────
CREATE TABLE problem_photos (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id  INT UNSIGNED NOT NULL,
  filename    VARCHAR(255) NOT NULL,
  s3_key      VARCHAR(512) NOT NULL,
  s3_url      VARCHAR(1024) NOT NULL,
  size_bytes  INT UNSIGNED DEFAULT NULL,
  mime_type   VARCHAR(50)  DEFAULT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pp_prob FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_pp_problem (problem_id)
) ENGINE=InnoDB;

-- ── Work updates (NEW in v2) ──────────────────────────────────
CREATE TABLE work_updates (
  id                      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id              INT UNSIGNED NOT NULL,
  user_id                 INT UNSIGNED NOT NULL,
  description             TEXT         NOT NULL,
  location_name           VARCHAR(200) DEFAULT NULL,
  status                  ENUM('submitted','ai_verified','approved','disputed') NOT NULL DEFAULT 'submitted',
  -- Groq AI fields
  ai_analysis             TEXT         DEFAULT NULL,
  ai_work_completion_pct  TINYINT UNSIGNED DEFAULT NULL,
  quality_assessment      TEXT         DEFAULT NULL,
  -- Engagement
  helpful_votes           INT UNSIGNED NOT NULL DEFAULT 0,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wu_prob FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT fk_wu_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_wu_problem (problem_id),
  INDEX idx_wu_status  (status)
) ENGINE=InnoDB;

-- ── Work update photos ────────────────────────────────────────
CREATE TABLE work_update_photos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  work_update_id   INT UNSIGNED NOT NULL,
  filename         VARCHAR(255) NOT NULL,
  s3_key           VARCHAR(512) NOT NULL,
  s3_url           VARCHAR(1024) NOT NULL,
  size_bytes       INT UNSIGNED DEFAULT NULL,
  mime_type        VARCHAR(50)  DEFAULT NULL,
  uploaded_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wup_wu FOREIGN KEY (work_update_id) REFERENCES work_updates(id) ON DELETE CASCADE,
  INDEX idx_wup_update (work_update_id)
) ENGINE=InnoDB;

-- ── Upvotes ───────────────────────────────────────────────────
CREATE TABLE upvotes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_upvote (problem_id, user_id),
  CONSTRAINT fk_uv_prob FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT fk_uv_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Comments ──────────────────────────────────────────────────
CREATE TABLE comments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id  INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  content     TEXT NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cm_prob FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT fk_cm_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_cm_problem (problem_id)
) ENGINE=InnoDB;

-- ── Status history ────────────────────────────────────────────
CREATE TABLE status_history (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id   INT UNSIGNED NOT NULL,
  changed_by   INT UNSIGNED NOT NULL,
  old_status   ENUM('pending','in_review','in_progress','resolved','rejected') DEFAULT NULL,
  new_status   ENUM('pending','in_review','in_progress','resolved','rejected') NOT NULL,
  old_priority ENUM('low','medium','high','critical') DEFAULT NULL,
  new_priority ENUM('low','medium','high','critical') DEFAULT NULL,
  notes        TEXT DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sh_prob FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT fk_sh_user FOREIGN KEY (changed_by) REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_sh_problem (problem_id)
) ENGINE=InnoDB;

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  problem_id INT UNSIGNED DEFAULT NULL,
  type       ENUM('status_change','comment','upvote','work_update','system') NOT NULL,
  title      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_nt_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_nt_prob FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
  INDEX idx_nt_user   (user_id),
  INDEX idx_nt_unread (user_id, is_read)
) ENGINE=InnoDB;

-- ── Analytics view ────────────────────────────────────────────
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM problems)                                    AS total_problems,
  (SELECT COUNT(*) FROM problems WHERE status = 'pending')           AS pending,
  (SELECT COUNT(*) FROM problems WHERE status = 'in_progress')       AS in_progress,
  (SELECT COUNT(*) FROM problems WHERE status = 'resolved')          AS resolved,
  (SELECT COUNT(*) FROM users WHERE role = 'user')                   AS total_users,
  (SELECT COUNT(*) FROM problems WHERE DATE(created_at) = CURDATE()) AS today_reports,
  (SELECT ROUND(AVG(ai_severity_score),1) FROM problems WHERE ai_severity_score IS NOT NULL) AS avg_severity,
  (SELECT COUNT(*) FROM work_updates)                                AS total_work_updates;

-- ── Default admin (password: Admin@1234) ──────────────────────
INSERT INTO users (name, email, password, phone, state, district, village, role)
VALUES (
  'Portal Admin',
  'admin@ruralportal.in',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsG/8wHKr2uFB0u/TpAKYrn6JjNm',
  '+910000000000',
  'Delhi', 'New Delhi', 'Admin Office',
  'admin'
);

-- ── Governance additional columns ─────────────────────────────
ALTER TABLE users
  ADD COLUMN taluka VARCHAR(100) DEFAULT NULL AFTER district,
  ADD COLUMN jurisdiction VARCHAR(500) DEFAULT NULL AFTER taluka,
  ADD COLUMN constituency VARCHAR(200) DEFAULT NULL AFTER jurisdiction;
ALTER TABLE problems
ADD COLUMN taluka VARCHAR(100) DEFAULT NULL AFTER village,
ADD COLUMN ward VARCHAR(100) DEFAULT NULL AFTER taluka;ALTER TABLE problems
ADD COLUMN taluka VARCHAR(100) DEFAULT NULL AFTER village,
ADD COLUMN ward VARCHAR(100) DEFAULT NULL AFTER taluka;
-- ── Budget allocations table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS budget_allocations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  state           VARCHAR(100) NOT NULL,
  district        VARCHAR(100) NOT NULL,
  taluka          VARCHAR(100) DEFAULT NULL,
  village         VARCHAR(150) DEFAULT NULL,
  budget_allocated DECIMAL(14,2) NOT NULL DEFAULT 0,
  budget_used      DECIMAL(14,2) NOT NULL DEFAULT 0,
  financial_year  VARCHAR(10)  NOT NULL DEFAULT '2025-26',
  allocated_by    INT UNSIGNED DEFAULT NULL,
  allocated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes           TEXT DEFAULT NULL,
  UNIQUE KEY uq_budget (state, district, taluka, village, financial_year),
  CONSTRAINT fk_ba_user FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ba_state    (state),
  INDEX idx_ba_district (state, district),
  INDEX idx_ba_taluka   (state, district, taluka),
  INDEX idx_ba_village  (state, district, village)
) ENGINE=InnoDB;

-- ── Governance announcements ──────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  author_id   INT UNSIGNED NOT NULL,
  role        ENUM('cm','collector','mla','sarpanch','gramsevak','admin') NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL,
  scope_state   VARCHAR(100) DEFAULT NULL,
  scope_district VARCHAR(100) DEFAULT NULL,
  scope_taluka  VARCHAR(100) DEFAULT NULL,
  scope_village VARCHAR(150) DEFAULT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMP DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ann_user FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ann_scope (scope_state, scope_district, scope_taluka),
  INDEX idx_ann_role  (role)
) ENGINE=InnoDB;

-- ── Sample governance users ───────────────────────────────────
INSERT IGNORE INTO users (name, email, password, phone, state, district, taluka, village, role) VALUES
  ('CM Yogi Adityanath',  'cm@ruralportal.in',        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsG/8wHKr2uFB0u/TpAKYrn6JjNm', '+910000000001', 'Uttar Pradesh', 'Varanasi',    NULL,      NULL,     'cm'),
  ('Collector Sharma',    'collector@ruralportal.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsG/8wHKr2uFB0u/TpAKYrn6JjNm', '+910000000002', 'Uttar Pradesh', 'Varanasi',    NULL,      NULL,     'collector'),
  ('MLA Rajesh Kumar',    'mla@ruralportal.in',       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsG/8wHKr2uFB0u/TpAKYrn6JjNm', '+910000000003', 'Uttar Pradesh', 'Varanasi',    'Kashi',   NULL,     'mla'),
  ('Sarpanch Devi',       'sarpanch@ruralportal.in',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsG/8wHKr2uFB0u/TpAKYrn6JjNm', '+910000000004', 'Uttar Pradesh', 'Varanasi',    'Kashi',   'Rampur', 'sarpanch'),
  ('GramSevak Mohan',     'gramsevak@ruralportal.in', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TsG/8wHKr2uFB0u/TpAKYrn6JjNm', '+910000000005', 'Uttar Pradesh', 'Varanasi',    'Kashi',   'Rampur', 'gramsevak');

-- Update problems with taluka where missing (for demo)
UPDATE problems SET taluka = 'Kashi' WHERE district = 'Varanasi' AND taluka IS NULL;

-- Sample budget allocation (CM → District)
INSERT IGNORE INTO budget_allocations (state, district, budget_allocated, financial_year)
VALUES ('Uttar Pradesh', 'Varanasi', 50000000, '2025-26');

-- District → Taluka
INSERT IGNORE INTO budget_allocations (state, district, taluka, budget_allocated, financial_year)
VALUES ('Uttar Pradesh', 'Varanasi', 'Kashi', 12500000, '2025-26');

-- Taluka → Village
INSERT IGNORE INTO budget_allocations (state, district, taluka, village, budget_allocated, financial_year)
VALUES ('Uttar Pradesh', 'Varanasi', 'Kashi', 'Rampur', 2500000, '2025-26');
