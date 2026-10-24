/* ── Manman Sol — Type Definitions ─────────────────────────────────────── */

export type UserRole = 'admin' | 'chef' | 'manm'

export interface User {
  id:        string
  prenom:    string
  nom:       string
  telefon:   string
  password:  string
  role:      UserRole
  blocked:   boolean
  createdAt: string
  /* Password reset */
  resetCode?:    string
  resetExpire?:  string
  resetTries?:   number
}

export interface PublicUser {
  id:        string
  prenom:    string
  nom:       string
  telefon:   string
  role:      UserRole
  blocked:   boolean
  createdAt: string
}

/* ── Sol ────────────────────────────────────────────────────────────────── */

export type Frequence = 'chak-semèn' | 'de-semèn' | 'chak-mwa' | '3-mwa' | '6-mwa' | 'ane'
export type SolStatus  = 'annatant' | 'aktif' | 'konplè' | 'rete'
export type Devis      = 'HTG' | 'USD'

export interface SolManm {
  entryId:  string   /* unique per slot — a user can hold multiple slots */
  userId:   string
  prenom:   string
  nom:      string
  telefon:  string
  pozisyon: number   /* 1-indexed payout order (0 = not drawn yet) */
  rejwen:   string
}

export interface Sol {
  id:          string
  nom:         string
  description: string
  chefId:      string
  chefNom:     string
  montant:     number
  devis:       Devis
  frequence:   Frequence
  manm:        SolManm[]
  maxManm:     number
  dateDebut:   string
  dateFin?:    string
  status:      SolStatus
  peryòdAktif: number
  tirajFèt:    boolean
  createdAt:   string
}

/* ── Payment ────────────────────────────────────────────────────────────── */

export type PemanStatus = 'peye' | 'annatant' | 'an-reta'
export type MetòdPeman  = 'cash' | 'moncash' | 'natcash' | 'lajan-men'

export interface Peman {
  id:        string
  solId:     string
  userId:    string
  entryId?:  string
  prenom:    string
  nom:       string
  peryòd:    number
  montan:    number
  devis:     Devis
  metòd:     MetòdPeman
  status:    PemanStatus
  datePeman: string
  note?:     string
  konfimepa: string
}

/* ── Payout (Touche) Record ─────────────────────────────────────────────── */

export type ToucheStatus = 'annatant' | 'demande' | 'konfime'

export interface ToucheRecord {
  id:           string
  solId:        string
  userId:       string
  peryòd:       number
  datePrevwa:   string   /* scheduled date */
  status:       ToucheStatus
  notif24h:     boolean
  notifJou:     boolean
  metòd?:       string
  dateKonfime?: string
  dateDemande?: string
  note?:        string
}

/* ── Notification ───────────────────────────────────────────────────────── */

export type NotifType =
  | 'pre-touche'      /* 24h before payout */
  | 'jou-touche'      /* day of payout */
  | 'konfime-touche'  /* member confirmed receipt */
  | 'demande-peman'   /* member requested payment */
  | 'peman-resevwa'   /* admin confirmed payment sent */

export interface Notification {
  id:       string
  userId:   string   /* recipient */
  solId:    string
  type:     NotifType
  titre:    string
  mesaj:    string
  li:       boolean
  date:     string
  metadata?: Record<string, string | number>
}

/* ── Tiraj ──────────────────────────────────────────────────────────────── */

export interface TirajEvent {
  id:      string
  solId:   string
  date:    string
  rezilta: { entryId: string; userId: string; prenom: string; nom: string; pozisyon: number }[]
  fèpa:    string
}

/* ── Stats ──────────────────────────────────────────────────────────────── */

export interface SolStats {
  totalManm:     number
  totalKolekte:  number
  totalAtann:    number
  pwosentPeye:   number
  pwochènTouche: { prenom: string; nom: string; peryòd: number } | null
}
