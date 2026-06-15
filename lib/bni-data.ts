export type DirectorRole = 'admin' | 'executive_director' | 'launch_consultant'
export type RecommendationStatus = 'new' | 'recommendation_confirmed' | 'invited_bni' | 'member_bni' | 'rejected'
export type DomainStatus = 'open' | 'filled'
export const RECOMMENDATIONS_STORAGE_KEY = 'bni-gold-recommendations'
export const GROUPS_STORAGE_KEY = 'bni-gold-groups'
export const DOMAINS_STORAGE_KEY = 'bni-gold-domains'
export const DIRECTORS_STORAGE_KEY = 'bni-gold-directors'
export const EMAIL_TEMPLATES_STORAGE_KEY = 'bni-gold-email-templates'
export const EMAIL_LOG_STORAGE_KEY = 'bni-gold-email-log'
export const REGULATION_STORAGE_KEY = 'bni-gold-regulation'
export const SMTP_SETTINGS_STORAGE_KEY = 'bni-gold-smtp-settings'
export type EmailTemplateType = 'recommendation_confirmation' | 'status_update' | 'new_member_thanks' | 'recommendation_notification'

export interface Director {
  id: number
  name: string
  email: string
  role: DirectorRole
  temporaryPassword: string
  mustChangePassword?: boolean
  region?: string
  regions?: string[]
  /** @deprecated legacy single launch group — use `groups`. Read via getDirectorGroups(). */
  group?: string
  groups?: string[]
}

export interface Group {
  name: string
  region: string
  director: string
  status: string
  currentMembers: number
  launchTargetMembers: number
  active?: boolean
}

export interface Recommendation {
  id: number
  from: string
  to: string
  domain: string
  details: string
  date: string
  status: RecommendationStatus
  group: string
  recommendingGroup?: string
  recommenderPhone?: string
  recommenderEmail?: string
  recommendedPhone?: string
  contactNotes?: string
  consentConfirmed?: boolean
  fitDetails?: string
}

export interface PriorityDomain {
  id: number
  name: string
  description: string
  status: DomainStatus
  group: string
  filledBy?: string
  filledFromRecommendationId?: number
  inSlots?: boolean
}

export type SeatColor = 'green' | 'yellow' | 'gray'

export interface GoldPerformer {
  id: number
  name: string
  group: string
  region: string
  business: string
  sponsoredMembers: number
  competitionRecommendations: number
  bniProfileUrl?: string
}

export interface EmailTemplate {
  type: EmailTemplateType
  title: string
  subject: string
  body: string
}

export interface EmailLog {
  id: number
  type: EmailTemplateType
  to: string
  subject: string
  body: string
  recommendationId?: number
  createdAt: string
  status: 'generat' | 'trimis' | 'eroare'
  error?: string
}

export interface RegulationContent {
  eyebrow: string
  title: string
  subtitle: string
  periodTitle: string
  periodBody: string
  objectiveTitle: string
  objectiveBody: string
  scoringTitle: string
  scoringRows: string[]
  prizesTitle: string
  prizesBody: string
  transparencyTitle: string
  transparencyBody: string
}

export interface SmtpSettings {
  host: string
  port: string
  secure: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
  replyTo: string
}

export const initialSmtpSettings: SmtpSettings = {
  host: '',
  port: '587',
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'BNI Gold Members Romania',
  replyTo: '',
}

export const initialRegulationContent: RegulationContent = {
  eyebrow: 'Regulament',
  title: 'Competitia BNI Gold Members',
  subtitle: 'Termenii de desfasurare pentru competitia recomandarilor care ajuta grupurile in formare sa ajunga la lansare.',
  periodTitle: 'Perioada campaniei',
  periodBody: '1 iunie 2026 – 31 august 2026. Doar recomandarile trimise in acest interval intra in clasamentul competitiei.',
  objectiveTitle: 'Obiectiv',
  objectiveBody: 'Membrii BNI trimit recomandari catre grupurile in formare. Fiecare recomandare este validata de directorul responsabil, iar evolutia se vede in clasamentele publice.',
  scoringTitle: 'Punctaj',
  scoringRows: [
    'Recomandare noua: 1 punct',
    'Recomandare confirmata: 3 puncte',
    'Invitat BNI: 6 puncte',
    'Membru BNI: 10 puncte',
  ],
  prizesTitle: 'Premii',
  prizesBody: 'Top 5 membri care recomanda primesc cate un bilet la Conferinta Nationala BNI 2027 alaturi de persoana care a devenit membru BNI prin recomandarea lor.\n\nPremierea se face in cadrul Conferintei Nationale a grupurilor si a sponsorilor.',
  transparencyTitle: 'Validare si transparenta',
  transparencyBody: 'O recomandare intra in competitie dupa trimiterea formularului. Statusul este actualizat de directorul responsabil, iar punctajul membrului se modifica in functie de progresul recomandarii.',
}

export const initialEmailTemplates: EmailTemplate[] = [
  {
    type: 'recommendation_confirmation',
    title: 'Confirmare trimitere recomandare in sistem',
    subject: 'Recomandarea ta pentru {{recommendedName}} a fost inregistrata',
    body: 'Salut {{recommenderName}},\n\nRecomandarea ta pentru {{recommendedName}}, domeniul {{domain}}, catre grupul {{group}}, a fost inregistrata in sistem si va fi validata de echipa BNI responsabila.\n\nIti multumim pentru implicare,\nBNI Gold Members Romania',
  },
  {
    type: 'status_update',
    title: 'Update status recomandare',
    subject: 'Status actualizat pentru recomandarea {{recommendedName}}',
    body: 'Salut {{recommenderName}},\n\nStatusul recomandarii tale pentru {{recommendedName}}, domeniul {{domain}}, a fost actualizat la: {{status}}.\n\nMultumim ca sustii lansarea grupului {{group}}.\nBNI Gold Members Romania',
  },
  {
    type: 'new_member_thanks',
    title: 'Multumesc pentru un membru nou',
    subject: 'Multumim pentru noul membru adus in BNI',
    body: 'Salut {{recommenderName}},\n\nFelicitari! Recomandarea ta pentru {{recommendedName}} a ajutat grupul {{group}} sa creasca printr-un membru nou BNI.\n\nAcesta este exact spiritul de giver care construieste comunitatea.\nBNI Gold Members Romania',
  },
  {
    type: 'recommendation_notification',
    title: 'Notificare director: recomandare noua de validat',
    subject: 'Recomandare noua pentru grupul {{group}} - de validat',
    body: 'Salut {{directorName}},\n\nA fost inregistrata o recomandare noua pentru grupul {{group}}:\n\n- Recomandata de: {{recommenderName}}\n- Persoana recomandata: {{recommendedName}}\n- Domeniu: {{domain}}\n\nTe rugam sa o validezi cat mai repede din panoul de administrare.\n\nBNI Gold Members Romania',
  },
]

export const regions = [
  'Alba',
  'Arad',
  'Arges',
  'Bacau',
  'Bihor',
  'Bistrita-Nasaud',
  'Botosani',
  'Brasov',
  'Braila',
  'Bucuresti',
  'Buzau',
  'Caras-Severin',
  'Calarasi',
  'Cluj',
  'Constanta',
  'Covasna',
  'Dambovita',
  'Dolj',
  'Galati',
  'Giurgiu',
  'Gorj',
  'Harghita',
  'Hunedoara',
  'Ialomita',
  'Iasi',
  'Ilfov',
  'Maramures',
  'Mehedinti',
  'Mures',
  'Neamt',
  'Olt',
  'Prahova',
  'Satu Mare',
  'Salaj',
  'Sibiu',
  'Suceava',
  'Teleorman',
  'Timis',
  'Tulcea',
  'Vaslui',
  'Valcea',
  'Vrancea',
]

export const initialGroups: Group[] = [
  { name: 'BNI Ignite', region: 'Bucuresti', director: '', status: 'in formare', currentMembers: 19, launchTargetMembers: 25 },
  { name: 'BNI Future', region: 'Bucuresti', director: '', status: 'in formare', currentMembers: 23, launchTargetMembers: 25 },
  { name: 'BNI ScaleUp (mornig)', region: 'Bucuresti', director: '', status: 'in formare', currentMembers: 4, launchTargetMembers: 25 },
  { name: 'BNI Mogosoaia', region: 'Bucuresti', director: '', status: 'in formare', currentMembers: 12, launchTargetMembers: 25 },
  { name: 'BNI Excellence', region: 'Bucuresti', director: '', status: 'in formare', currentMembers: 18, launchTargetMembers: 25 },
  { name: 'BNI Vector', region: 'Bihor', director: '', status: 'in formare', currentMembers: 15, launchTargetMembers: 25 },
  { name: 'BNI Sun', region: 'Braila-Galati', director: '', status: 'in formare', currentMembers: 16, launchTargetMembers: 25 },
  { name: 'BNI Rise - Calarasi', region: 'Braila-Galati', director: '', status: 'in formare', currentMembers: 1, launchTargetMembers: 25 },
  { name: 'Mountains', region: 'Brasov', director: '', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
  { name: 'BNI Confidence Winners', region: 'Buzau', director: '', status: 'in formare', currentMembers: 19, launchTargetMembers: 25 },
  { name: 'BNI Axa Dej', region: 'Cluj', director: '', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
  { name: 'BNI HEALTH', region: 'Cluj', director: 'Adrian Covasa', status: 'in formare', currentMembers: 18, launchTargetMembers: 25 },
  { name: 'BNI Vision', region: 'Constanta', director: '', status: 'in formare', currentMembers: 21, launchTargetMembers: 25 },
  { name: 'BNI STARS', region: 'Constanta', director: '', status: 'in formare', currentMembers: 7, launchTargetMembers: 25 },
  { name: 'BNI Medgidia/Cernavoda', region: 'Constanta', director: '', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
  { name: 'BNI Braila', region: 'Galati-Braila', director: '', status: 'in formare', currentMembers: 1, launchTargetMembers: 25 },
  { name: 'BNI Altius', region: 'Iasi', director: '', status: 'in formare', currentMembers: 5, launchTargetMembers: 25 },
  { name: 'BNI Baia Mare 2', region: 'Maramures', director: '', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
  { name: 'BNI Sighet 1', region: 'Maramures', director: '', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
  { name: 'BNI Symphony', region: 'Mures', director: '', status: 'in formare', currentMembers: 4, launchTargetMembers: 25 },
  { name: 'BNI Nexus/hibrid', region: 'Prahova', director: '', status: 'in formare', currentMembers: 5, launchTargetMembers: 25 },
  { name: 'BNI Heltau', region: 'Sibiu', director: '', status: 'in formare', currentMembers: 2, launchTargetMembers: 25 },
  { name: 'BNI Green Light', region: 'Sibiu', director: '', status: 'in formare', currentMembers: 22, launchTargetMembers: 25 },
  { name: 'BNI MAGNUM OPUS', region: 'Salaj', director: 'Calin Hirza', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
  { name: 'BNI Pelicanii', region: 'Tulcea', director: '', status: 'in formare', currentMembers: 3, launchTargetMembers: 25 },
  { name: 'BNI GOLD', region: 'Timis', director: 'Adina Arjoca', status: 'in formare', currentMembers: 6, launchTargetMembers: 25 },
  { name: 'BNI Alutus', region: 'Valcea', director: '', status: 'in formare', currentMembers: 1, launchTargetMembers: 25 },
  { name: 'BNI Impact', region: 'Arges', director: '', status: 'in formare', currentMembers: 0, launchTargetMembers: 25 },
]

export const initialDirectors: Director[] = [
  { id: 0, name: 'Admin BNI', email: 'admin@bnigold.ro', role: 'admin', temporaryPassword: 'admin2026' },
  { id: 1, name: 'Manuela Voicila', email: 'manuela.voicila@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 2, name: 'Paul', email: 'paul@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 3, name: 'Philippe', email: 'philippe@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 4, name: 'Adela', email: 'adela@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 5, name: 'Ana Lupu', email: 'ana.lupu@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 6, name: 'Andrei Andoni', email: 'andrei.andoni@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 7, name: 'Bogdan Ciubota', email: 'bogdan.ciubota@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 8, name: 'Botond Peres', email: 'botond.peres@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 9, name: 'Cleopatra Catana', email: 'cleopatra.catana@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 10, name: 'Daciana Paler', email: 'daciana.paler@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 11, name: 'Ionut Administration', email: 'ionut.administration@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 12, name: 'Nicoleta Sacu', email: 'nicoleta.sacu@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 13, name: 'Monica', email: 'monica@bni.local', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 14, name: 'Andrei Aron', email: 'andrei.aron@resize-media.com', role: 'executive_director', temporaryPassword: 'bni2026' },
  { id: 15, name: 'Adina Arjoca', email: 'adina@bni.ro', role: 'launch_consultant', temporaryPassword: 'admin2024', groups: ['BNI GOLD'] },
  { id: 16, name: 'Calin Hirza', email: 'calin@bni.ro', role: 'launch_consultant', temporaryPassword: 'admin2024', groups: ['BNI MAGNUM OPUS'] },
  { id: 17, name: 'Adrian Covasa', email: 'adrian@bni.ro', role: 'launch_consultant', temporaryPassword: 'admin2024', groups: ['BNI HEALTH'] },
]

export const initialRecommendations: Recommendation[] = [
  { id: 1, from: 'Ion Popescu', to: 'Maria Ionescu', domain: 'Contabilitate', details: 'Firma de contabilitate pentru IMM', date: '2026-05-20', status: 'new', group: 'BNI GOLD' },
  { id: 2, from: 'Ana Marinescu', to: 'Vlad Popa', domain: 'IT Services', details: 'Dezvoltare web si hosting', date: '2026-05-19', status: 'member_bni', group: 'BNI GOLD' },
  { id: 3, from: 'Mihai Stan', to: 'Elena Radu', domain: 'Asigurari', details: 'Asigurari auto si CASCO', date: '2026-05-18', status: 'new', group: 'BNI MAGNUM OPUS' },
  { id: 4, from: 'Cristina Vas', to: 'Dan Moldovan', domain: 'Marketing Digital', details: 'Campanii social media', date: '2026-05-17', status: 'recommendation_confirmed', group: 'BNI HEALTH' },
  { id: 5, from: 'Sorin Dima', to: 'Andrei Luca', domain: 'Constructii', details: 'Renovari si amenajari pentru birouri', date: '2026-05-16', status: 'member_bni', group: 'BNI MAGNUM OPUS' },
  { id: 6, from: 'Elena Radu', to: 'Oana Petrescu', domain: 'Medicina Muncii', details: 'Servicii SSM si medicina muncii', date: '2026-05-15', status: 'invited_bni', group: 'BNI HEALTH' },
]

export const initialPriorityDomains: PriorityDomain[] = [
  { id: 1, name: 'Contabilitate', description: 'Servicii contabile si financiare', status: 'open', group: 'BNI GOLD' },
  { id: 2, name: 'IT Services', description: 'Dezvoltare software, hosting, suport IT', status: 'filled', filledBy: 'Ana Marinescu', filledFromRecommendationId: 2, group: 'BNI GOLD' },
  { id: 3, name: 'Asigurari', description: 'Asigurari generale si de viata', status: 'open', group: 'BNI GOLD' },
  { id: 4, name: 'Avocatura', description: 'Consultanta juridica si drept comercial', status: 'open', group: 'BNI GOLD' },
  { id: 5, name: 'Marketing Digital', description: 'Social media, SEO, campanii online', status: 'open', group: 'BNI GOLD' },
  { id: 11, name: 'Finantari', description: 'Credite, leasing si consultanta financiara', status: 'open', group: 'BNI GOLD' },
  { id: 6, name: 'Constructii', description: 'Constructii civile si renovari', status: 'filled', filledBy: 'Sorin Dima', filledFromRecommendationId: 5, group: 'BNI MAGNUM OPUS' },
  { id: 7, name: 'Imobiliare', description: 'Vanzari si inchirieri proprietati', status: 'open', group: 'BNI MAGNUM OPUS' },
  { id: 8, name: 'Transport', description: 'Logistica si transport marfa', status: 'open', group: 'BNI MAGNUM OPUS' },
  { id: 12, name: 'Consultanta fiscala', description: 'Optimizare fiscala si raportari', status: 'open', group: 'BNI MAGNUM OPUS' },
  { id: 13, name: 'Energie solara', description: 'Panouri fotovoltaice si eficienta energetica', status: 'open', group: 'BNI MAGNUM OPUS' },
  { id: 14, name: 'Servicii auto', description: 'Flote, service si mentenanta auto', status: 'open', group: 'BNI MAGNUM OPUS' },
  { id: 9, name: 'Resurse Umane', description: 'Recrutare si HR outsourcing', status: 'open', group: 'BNI HEALTH' },
  { id: 10, name: 'Medicina Muncii', description: 'Servicii SSM si medicina muncii', status: 'filled', filledBy: 'Elena Radu', filledFromRecommendationId: 6, group: 'BNI HEALTH' },
  { id: 15, name: 'Stomatologie', description: 'Clinici si servicii stomatologice', status: 'open', group: 'BNI HEALTH' },
  { id: 16, name: 'Nutritie', description: 'Consultanta nutritionala si wellness', status: 'open', group: 'BNI HEALTH' },
  { id: 17, name: 'Kinetoterapie', description: 'Recuperare medicala si terapie fizica', status: 'open', group: 'BNI HEALTH' },
  { id: 18, name: 'Farmacie', description: 'Produse farmaceutice si parafarmacie', status: 'open', group: 'BNI HEALTH' },
]

export const goldThreshold = 6

export const initialGoldPerformers: GoldPerformer[] = [
  { id: 1, name: 'Angela Cojocaru', group: 'BNI ZEPPELIN TIMIS', region: 'Timis', business: 'Consultanta business', sponsoredMembers: 8, competitionRecommendations: 2, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 2, name: 'Alexandra Revnic', group: 'ELITE BNI BUCURESTI', region: 'Bucuresti', business: 'Training si leadership', sponsoredMembers: 7, competitionRecommendations: 1, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 3, name: 'Bianca Costea', group: 'WAVE BNI CONSTANTA', region: 'Constanta', business: 'Servicii financiare', sponsoredMembers: 6, competitionRecommendations: 3, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 4, name: 'Cristian Iepure', group: 'BNI FORTE CLUJ', region: 'Cluj', business: 'Consultanta juridica', sponsoredMembers: 5, competitionRecommendations: 2, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 5, name: 'Catalina Costache', group: 'BNI PARETO SIBIU', region: 'Sibiu', business: 'Marketing strategic', sponsoredMembers: 5, competitionRecommendations: 1, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 6, name: 'Cleopatra Catana', group: 'BNI CREATIV CLUJ', region: 'Cluj', business: 'Arhitectura si design', sponsoredMembers: 4, competitionRecommendations: 2, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 7, name: 'Ana Marinescu', group: 'BNI GOLD', region: 'Timis', business: 'IT Services', sponsoredMembers: 4, competitionRecommendations: 1, bniProfileUrl: 'https://www.bniconnectglobal.com' },
  { id: 8, name: 'Sorin Dima', group: 'BNI MAGNUM OPUS', region: 'Salaj', business: 'Constructii', sponsoredMembers: 3, competitionRecommendations: 1, bniProfileUrl: 'https://www.bniconnectglobal.com' },
]

export function getGroupRegion(groupName: string, groups: Group[] = initialGroups) {
  return groups.find((group) => group.name === groupName)?.region
}

export function getDirectorRegions(director: Director) {
  return Array.from(new Set([...(director.regions || []), director.region].filter(Boolean) as string[]))
}

// Launch scope. Normalizes the legacy single `group` field into the `groups` array.
export function getDirectorGroups(director: Director) {
  if (director.groups && director.groups.length) return Array.from(new Set(director.groups))
  return director.group ? [director.group] : []
}

// Visibility + scope are additive: a director sees groups in their executive regions
// AND any groups they launch-consult, regardless of the primary `role` label.
export function getGroupsForDirector(director: Director, groups: Group[]) {
  if (director.role === 'admin') {
    return groups
  }

  const directorRegions = getDirectorRegions(director)
  const directorGroups = getDirectorGroups(director)
  return groups.filter((group) => directorRegions.includes(group.region) || directorGroups.includes(group.name))
}

export function isGroupActive(group: Group) {
  return group.active !== false
}

export function getRecommendedMemberCount(group: Group | string, domains: PriorityDomain[]) {
  const groupName = typeof group === 'string' ? group : group.name
  const currentMembers = typeof group === 'string' ? initialGroups.find((item) => item.name === groupName)?.currentMembers || 0 : group.currentMembers
  const recommendedMembers = domains.filter((domain) => domain.group === groupName && domain.status === 'filled').length

  return currentMembers + recommendedMembers
}

export function getLaunchCompletionPercent(group: Group, domains: PriorityDomain[]) {
  const recommendedMembers = getRecommendedMemberCount(group, domains)
  const target = Math.max(group.launchTargetMembers, 1)

  return Math.min(Math.round((recommendedMembers / target) * 100), 100)
}

export function getLaunchProgressLabel(group: Group, domains: PriorityDomain[]) {
  const recommendedMembers = getRecommendedMemberCount(group, domains)
  const remaining = Math.max(group.launchTargetMembers - recommendedMembers, 0)

  if (remaining === 0) {
    return 'Pregatit pentru lansare'
  }

  if (remaining <= 2) {
    return `Ultima suta de metri: mai lipsesc ${remaining} membri`
  }

  return `Mai avem nevoie de ${remaining} membri sa lansam grupul`
}

export function getActiveSlotDomains(group: Group | string, domains: PriorityDomain[]) {
  const groupName = typeof group === 'string' ? group : group.name
  return domains
    .filter((domain) => domain.group === groupName && domain.inSlots !== false)
    .slice(0, 6)
}

// Launch seats: yellow = members already secured outside the recommendation flow
// (group.currentMembers, manually set by directors); green = domains filled via a
// validated recommendation; gray = remaining open seats up to the launch target.
// Order is always yellow, then green, then gray.
export function getLaunchSeats(group: Group, domains: PriorityDomain[]): SeatColor[] {
  const target = Math.max(group.launchTargetMembers, 0)
  // Validated recommendations take priority and are always shown; manually-set
  // members (yellow) fill the remaining seats so the row never exceeds the target.
  const green = Math.min(domains.filter((domain) => domain.group === group.name && domain.filledFromRecommendationId != null).length, target)
  const yellow = Math.min(Math.max(group.currentMembers, 0), target - green)
  const gray = Math.max(target - green - yellow, 0)

  return [
    ...Array<SeatColor>(yellow).fill('yellow'),
    ...Array<SeatColor>(green).fill('green'),
    ...Array<SeatColor>(gray).fill('gray'),
  ]
}

export function getMemberLeaderboard(recommendations: Recommendation[]) {
  const rows = recommendations.reduce<Record<string, { name: string; group: string; sent: number; completed: number; points: number }>>((acc, recommendation) => {
    if (!acc[recommendation.from]) {
      acc[recommendation.from] = { name: recommendation.from, group: recommendation.recommendingGroup || recommendation.group, sent: 0, completed: 0, points: 0 }
    }

    acc[recommendation.from].sent += 1
    acc[recommendation.from].points += getRecommendationPoints(recommendation.status)
    if (recommendation.status === 'member_bni') {
      acc[recommendation.from].completed += 1
    }

    return acc
  }, {})

  return Object.values(rows).sort((a, b) => b.points - a.points || b.completed - a.completed || a.name.localeCompare(b.name))
}

export function getRecommendationPoints(status: RecommendationStatus) {
  const points: Record<RecommendationStatus, number> = {
    new: 1,
    recommendation_confirmed: 3,
    invited_bni: 6,
    member_bni: 10,
    rejected: 0,
  }

  return points[status]
}

export function isDomainRecommended(status: RecommendationStatus) {
  return status === 'recommendation_confirmed' || status === 'invited_bni' || status === 'member_bni'
}

export function getGoldProgress(member: GoldPerformer) {
  return Math.min(Math.round((member.sponsoredMembers / goldThreshold) * 100), 100)
}

export function getGoldStatus(member: GoldPerformer) {
  if (member.sponsoredMembers >= goldThreshold) {
    return 'Gold Club'
  }

  const remaining = goldThreshold - member.sponsoredMembers

  if (remaining <= 2) {
    return `Aproape de Gold: mai lipsesc ${remaining}`
  }

  return `In cursa: mai lipsesc ${remaining}`
}

export function renderEmailTemplate(template: EmailTemplate, values: Record<string, string>) {
  const replaceTokens = (text: string) => text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] || '')

  return {
    subject: replaceTokens(template.subject),
    body: replaceTokens(template.body),
  }
}
