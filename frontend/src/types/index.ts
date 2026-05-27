export interface User {
  id: string;
  civilite: string;
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  adresse?: string;
  profession?: string;
  organisme?: string;
  biographie?: string;
  email: string;
  role: 'user' | 'super_admin' | 'congress_admin' | 'reviewer' | 'finance_manager' | 'support';
  congress_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CongressStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Congress {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  edition?: string;
  start_date: string;
  end_date: string;
  location: string;
  city?: string;
  country?: string;
  organisational_structure?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
  badge_config?: Record<string, unknown> | null;
  admin_id?: string;
  attestations_available?: boolean;
  status: CongressStatus;
  super_admin_id: string;
  created_at: string;
  updated_at: string;
}

export interface CongressPayload {
  title: string;
  subtitle?: string;
  description?: string;
  edition?: string;
  start_date: string;
  end_date: string;
  location: string;
  city?: string;
  country?: string;
  status?: CongressStatus;
  organisational_structure?: Record<string, unknown>;
  config?: Record<string, unknown>;
  badge_config?: Record<string, unknown>;
}

export interface CreateCongressResponse {
  congress: Congress;
  admin_email: string;
  admin_password: string;
}

export interface ActorPayload {
  civilite: string;
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  email: string;
  password: string;
  role: 'reviewer' | 'finance_manager' | 'support';
}

export interface Soumission {
  id: string;
  submission_type: 'Abstract' | 'Poster' | 'Communication';
  theme: string;
  topics: string;
  document_title: string;
  author_name: string;
  resume: string;
  keywords: string[];
  file_path: string;
  user_id: string;
  user?: User;
  statut: 'En attente' | 'En révision' | 'Approuvée' | 'Rejetée';
  raison_rejet?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  notifiable_id: string;
  data: {
    message: string;
    soumission_id?: string;
    soumission_title?: string;
    raison?: string;
  };
  read_at?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  civilite: string;
  nom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  email: string;
  password: string;
  password_confirmation: string;
  organisme?: string;
  profession?: string;
  adresse?: string;
  biographie?: string;
}

export interface SoumissionRequest {
  submission_type: 'Abstract' | 'Poster' | 'Communication';
  theme: string;
  topics: string;
  document_title: string;
  author_name: string;
  resume: string;
  keywords: string[];
  file?: File;
}

export interface InscriptionRequest {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  organisme?: string;
  pays: string;
  tariff_label: string;
  participation_type: 'Présentiel' | 'En ligne';
  montant: number;
  methode_paiement: string;
  code_otp?: string;
  form_data?: Record<string, string>;
}

export interface Inscription {
  id: number;
  user_id: string;
  congress_id: string;
  congress?: Congress;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  organisme?: string;
  pays: string;
  tariff_label: string;
  participation_type: 'Présentiel' | 'En ligne';
  montant: number;
  methode_paiement: string;
  numero_facture: string;
  transaction_id?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export interface VirtualSession {
  id: string;
  congress_id: string;
  title: string;
  description?: string;
  session_type: 'plenary' | 'workshop' | 'presentation' | 'breakout';
  start_time: string;
  end_time: string;
  room_name: string;
  password?: string;
  max_participants: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  recording_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  congress?: Congress;
}

export interface VirtualAttendance {
  id: string;
  session_id: string;
  user_id: string;
  user?: User;
  join_time: string;
  leave_time?: string;
  duration: number;
  created_at: string;
}

export interface CreateSessionPayload {
  title: string;
  description?: string;
  session_type: string;
  start_time: string;
  end_time: string;
  password?: string;
  max_participants?: number;
  recording_enabled?: boolean;
}

export interface PricingOption {
  label: string;
  amount: number;
}

export interface ReviewGrid {
  id: string;
  congress_id: string;
  name: string;
  is_active: boolean;
  criteria?: ReviewCriterion[];
  created_at: string;
  updated_at: string;
}

export interface ReviewCriterion {
  id: string;
  review_grid_id: string;
  name: string;
  description?: string;
  max_score: number;
  weight: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CriterionScore {
  criterion_id: string;
  criterion_name: string;
  score: number;
  max_score: number;
}

export interface ReviewerInvitation {
  id: string;
  congress_id: string;
  email: string;
  nom?: string;
  prenom?: string;
  organisme?: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  reviewer_id?: string;
  invited_at: string;
  responded_at?: string;
  expires_at: string;
  last_reminder_at?: string;
  reminder_count: number;
  message?: string;
  created_at: string;
  updated_at: string;
}

export interface BroadcastMessage {
  id: string;
  congress_id: string;
  subject: string;
  body: string;
  target_type: string;
  sent_at?: string;
  sent_count: number;
  created_by: string;
  recipient_count?: number;
  read_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BroadcastTarget {
  key: string;
  label: string;
  count: number;
}

export interface ReviewerStat {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  assigned_count: number;
  in_progress_count: number;
  completed_count: number;
  total_count: number;
}

export interface ThematicCoordinator {
  user_id: string;
  theme: string;
  user_name: string;
  user_email: string;
}

export interface SoumissionStats {
  total: number;
  abstracts: number;
  posters: number;
  communications: number;
  enAttente: number;
  approuvees: number;
  rejetees: number;
  total_inscriptions: number;
  inscriptions_presentiel: number;
  inscriptions_en_ligne: number;
  inscriptions_virtuel: number;
  inscriptions_confirmees: number;
  inscriptions_en_attente: number;
}

export interface Review {
  id: string;
  soumission_id: string;
  soumission?: Soumission;
  reviewer_id: string;
  reviewer?: User;
  review_grid_id?: string;
  review_grid?: ReviewGrid;
  scores?: CriterionScore[];
  overall_score: number;
  comment: string;
  status: 'assigned' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ReviewStats {
  total_reviews: number;
  average_score: number;
  completed_count: number;
  pending_count: number;
}

export interface ProgramSlot {
  id: string;
  congress_id: string;
  soumission_id?: string;
  soumission?: Soumission;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  session_type: 'plenary' | 'parallel' | 'poster' | 'workshop' | 'presentation';
  order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramSlotPayload {
  soumission_id?: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  session_type?: string;
  order?: number;
}

export interface Proceeding {
  id: string;
  congress_id: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_image?: string;
  metadata?: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProceedingPayload {
  title: string;
  subtitle?: string;
  description?: string;
  cover_image?: string;
}

export interface ProceedingSubmission {
  id: string;
  proceeding_id: string;
  soumission_id: string;
  soumission?: Soumission;
  order: number;
  section_title: string;
  page_start: number;
  page_end: number;
  created_at: string;
}

export interface ProceedingDetail {
  proceeding: Proceeding;
  submissions: ProceedingSubmission[];
}
