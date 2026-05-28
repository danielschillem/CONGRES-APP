CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    civilite text NOT NULL,
    nom text NOT NULL,
    prenom text NOT NULL,
    sexe text NOT NULL,
    telephone text NOT NULL,
    adresse text,
    profession text,
    organisme text,
    biographie text,
    email text NOT NULL,
    password text NOT NULL,
    role text NOT NULL DEFAULT 'user',
    congress_id uuid,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telephone ON users(telephone);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS congresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    subtitle text,
    description text,
    edition text,
    start_date timestamptz NOT NULL,
    end_date timestamptz NOT NULL,
    location text NOT NULL,
    city text,
    country text,
    organisational_structure jsonb,
    config jsonb,
    badge_config jsonb,
    admin_id uuid,
    attestations_available boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'draft',
    super_admin_id uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soumissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type text NOT NULL,
    theme text NOT NULL,
    topics text NOT NULL,
    document_title text NOT NULL,
    author_name text NOT NULL,
    resume text NOT NULL,
    keywords text[],
    file_path text NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id),
    statut text NOT NULL DEFAULT 'En attente',
    raison_rejet text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_soumissions_user_id ON soumissions(user_id);

CREATE TABLE IF NOT EXISTS inscriptions (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id),
    congress_id uuid NOT NULL REFERENCES congresses(id),
    nom text NOT NULL,
    prenom text NOT NULL,
    email text NOT NULL,
    telephone text NOT NULL,
    organisme text NOT NULL,
    pays text NOT NULL,
    tariff_label text NOT NULL DEFAULT '',
    participation_type text NOT NULL,
    montant numeric NOT NULL,
    methode_paiement text NOT NULL,
    numero_facture text NOT NULL,
    transaction_id text,
    payment_status text DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inscriptions_numero_facture ON inscriptions(numero_facture);
CREATE INDEX IF NOT EXISTS idx_inscriptions_user_id ON inscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_congress_id ON inscriptions(congress_id);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL,
    notifiable_id uuid NOT NULL,
    data jsonb NOT NULL DEFAULT '{}',
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_notifiable_id ON notifications(notifiable_id);

CREATE TABLE IF NOT EXISTS virtual_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    congress_id uuid NOT NULL REFERENCES congresses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    session_type text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    room_name text NOT NULL,
    password text,
    max_participants integer NOT NULL DEFAULT 50,
    status text NOT NULL DEFAULT 'scheduled',
    recording_enabled boolean NOT NULL DEFAULT false,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS virtual_attendances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES virtual_sessions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id),
    join_time timestamptz NOT NULL DEFAULT now(),
    leave_time timestamptz,
    duration integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    soumission_id uuid NOT NULL REFERENCES soumissions(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES users(id),
    review_grid_id uuid,
    scores jsonb,
    overall_score double precision NOT NULL DEFAULT 0,
    comment text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'assigned',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_criteria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    review_grid_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    max_score double precision NOT NULL DEFAULT 5,
    weight double precision NOT NULL DEFAULT 1,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_grids (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    congress_id uuid REFERENCES congresses(id) ON DELETE SET NULL,
    name text NOT NULL,
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    congress_id uuid NOT NULL REFERENCES congresses(id) ON DELETE CASCADE,
    soumission_id uuid REFERENCES soumissions(id) ON DELETE SET NULL,
    title text NOT NULL,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    location text NOT NULL DEFAULT '',
    session_type text NOT NULL DEFAULT 'presentation',
    sort_order integer NOT NULL DEFAULT 0,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proceedings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    congress_id uuid NOT NULL REFERENCES congresses(id) ON DELETE CASCADE,
    title text NOT NULL,
    subtitle text,
    description text,
    cover_image text,
    isbn text,
    doi text,
    metadata jsonb,
    status text NOT NULL DEFAULT 'draft',
    published_at timestamptz,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proceeding_submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    proceeding_id uuid NOT NULL REFERENCES proceedings(id) ON DELETE CASCADE,
    soumission_id uuid NOT NULL REFERENCES soumissions(id) ON DELETE CASCADE,
    sort_order integer NOT NULL DEFAULT 0,
    section_title text NOT NULL DEFAULT '',
    page_start integer,
    page_end integer,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviewer_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    congress_id uuid NOT NULL REFERENCES congresses(id) ON DELETE CASCADE,
    email text NOT NULL,
    nom text,
    prenom text,
    organisme text,
    token text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    reviewer_id uuid REFERENCES users(id) ON DELETE SET NULL,
    invited_at timestamptz NOT NULL DEFAULT now(),
    responded_at timestamptz,
    expires_at timestamptz NOT NULL,
    last_reminder_at timestamptz,
    reminder_count integer NOT NULL DEFAULT 0,
    message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broadcast_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    congress_id uuid REFERENCES congresses(id) ON DELETE SET NULL,
    subject text NOT NULL,
    body text NOT NULL,
    target_type text NOT NULL DEFAULT 'all',
    sent_at timestamptz,
    sent_count integer NOT NULL DEFAULT 0,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broadcast_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id uuid NOT NULL REFERENCES broadcast_messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email text NOT NULL,
    sent_at timestamptz,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS thematic_coordinators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id),
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    details text,
    ip_address text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
