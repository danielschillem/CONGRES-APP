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
  role: 'user' | 'admin';
  active: boolean;
  created_at: string;
  updated_at: string;
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
  statut: 'En attente' | 'Approuvée' | 'Rejetée';
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
  participation_type: 'Présentiel' | 'En ligne' | 'Virtuel';
  montant: number;
  methode_paiement: string;
  code_otp: string;
}

export interface Inscription {
  id: number;
  user_id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  organisme?: string;
  pays: string;
  participation_type: 'Présentiel' | 'En ligne' | 'Virtuel';
  montant: number;
  methode_paiement: string;
  numero_facture: string;
  transaction_id?: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
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
