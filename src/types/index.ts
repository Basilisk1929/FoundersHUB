export type UserRole = "founder" | "investor" | "developer";

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  photoUrl?: string;
  bio?: string;
  theme?: "light" | "dark";
  skills?: string[];
  sectorsOfInterest?: string[];
  identityVerificationStatus?: "unverified" | "pending" | "self_attested" | "verified";
  identityDetails?: {
    idType: "aadhaar" | "pan";
    idLast4: string;
    documentName?: string;
    attestedAt: string;
  };
  totalPoints?: number;
  developerProfile?: DeveloperProfile;
  createdAt: string;
}

export interface PastProject {
  id: string;
  title: string;
  description: string;
  techStack: string[];
  primaryLanguage: string;
  languageColor: string;
  stars?: number;
  forks?: number;
  liveUrl?: string;
  githubUrl?: string;
  role?: string;
  stats?: string;
  isPinned?: boolean;
  completedAt?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
  skills?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  year: string;
  grade?: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface DeveloperProfile {
  handle?: string;
  headline?: string;
  location?: string;
  githubUsername?: string;
  codechefUsername?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  rating?: number; // CodeChef rating, e.g. 2184
  starsRating?: number; // 1-7 stars
  globalRank?: number;
  countryRank?: number;
  division?: string;
  streakDays?: number;
  longestStreak?: number;
  resumeUrl?: string;
  resumeFilename?: string;
  resumeLastUpdated?: string;
  resumeSummary?: string;
  pastProjects?: PastProject[];
  experience?: WorkExperience[];
  education?: EducationItem[];
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'sprint' | 'code' | 'equity' | 'honor';
    unlockedAt: string;
  }>;
  languageStats?: Record<string, number>;
  difficultySolved?: {
    easy: number;
    medium: number;
    hard: number;
    critical: number;
  };
  contributionHeatmap?: ContributionDay[];
}

export type StartupStage = 
  | "draft" 
  | "readiness_gate" 
  | "published" 
  | "sprint_active" 
  | "sprint_completed" 
  | "funded" 
  | "closed";

export interface StartupDoc {
  _id: string;
  founderId: string;
  founderName?: string;
  name: string;
  tagline: string;
  description: string;
  problemStatement: string;
  validationEvidence: string;
  sector: string;
  tags: string[];
  stage: StartupStage;
  proposedEquitySplit?: Record<string, number>; // e.g. { "founder": 60, "team": 30, "advisors": 10 }
  vestedEquitySplit?: Record<string, number>; // calculated dynamically based on contribution points
  pitchDeckUrl?: string;
  pitchVideoUrl?: string;
  images: string[];
  visibility: "private" | "public";
  executionScore: number; // 0-100
  ownershipHash?: string; // SHA-256 snapshot of readiness gate submission
  ownershipTimestamp?: string;
  activeSprintId?: string;
  totalFundedAmount?: number;
  isFundingPaused?: boolean;
  minTicketSize?: number;
  brandingPartnerships?: Array<{
    investorId: string;
    brandName: string;
    brandingLogoUrl: string;
    sponsorshipDurationDays: number;
    startsAt: string;
    expiresAt: string;
  }>;
  createdAt: string;
}

export type SprintStatus = "pending" | "active" | "completed" | "stalled" | "cancelled";

export interface SprintDoc {
  _id: string;
  startupId: string;
  durationDays: 14 | 21 | 30;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  founderCommitment: { type: "hours" | "deposit"; value: number };
  lastActivityAt: string;
  executionScore?: number;
}

export interface DepartmentDoc {
  _id: string;
  startupId: string;
  sprintId: string;
  name: string;
  memberIds: string[];
  description?: string;
}

export interface DepartmentAccessRequestDoc {
  _id: string;
  departmentId: string;
  startupId: string;
  developerId: string;
  developerName?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "backlog" | "in_progress" | "review" | "done" | "blocked";

export interface TaskDoc {
  _id: string;
  departmentId: string;
  startupId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assigneeName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  contributionPoints: number;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ContributionDoc {
  _id: string;
  startupId: string;
  developerId: string;
  developerName?: string;
  taskId: string;
  taskTitle?: string;
  points: number;
  awardedAt: string;
}

export interface ApplicationDoc {
  _id: string;
  startupId: string;
  startupName?: string;
  departmentId: string;
  departmentName?: string;
  developerId: string;
  developerName?: string;
  developerEmail?: string;
  coverNote?: string;
  resumeUrl: string;
  answers: Record<string, string>;
  status: "pending" | "accepted" | "rejected";
  appliedAt: string;
}

export interface FundingRequestDoc {
  _id: string;
  startupId: string;
  startupName?: string;
  investorId: string;
  investorName?: string;
  type: "investment" | "branding_partnership";
  amount?: number;
  message?: string;
  contactDetails?: string;
  brandingLogoUrl?: string;
  sponsorshipDurationDays?: number;
  agreementAccepted: boolean;
  status: "pending" | "accepted" | "rejected" | "completed";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: "created" | "success" | "failed";
  platformFeeAmount?: number;
  requestedAt: string;
  processedAt?: string;
}

export interface ExpenseDoc {
  _id: string;
  startupId: string;
  description: string;
  amount: number;
  category: "infrastructure" | "marketing" | "legal" | "tooling" | "payroll" | "other";
  date: string;
}

export interface TimelineEventDoc {
  _id: string;
  startupId: string;
  departmentId?: string;
  eventType: 
    | "joined" 
    | "task_committed" 
    | "file_committed" 
    | "ai_interaction" 
    | "funding_requested" 
    | "funding_accepted"
    | "sprint_started"
    | "sprint_completed"
    | "readiness_gate_passed";
  actorId: string;
  actorName?: string;
  details: string;
  createdAt: string;
}

export interface MessageDoc {
  _id: string;
  threadId: string; // e.g. "dept_<departmentId>" or "dm_<user1>_<user2>"
  startupId?: string;
  departmentId?: string;
  senderId: string;
  senderName: string;
  senderRole?: UserRole;
  text: string;
  createdAt: string;
}

export interface NotificationDoc {
  _id: string;
  userId: string;
  type: 
    | "application_received" 
    | "application_status" 
    | "dept_access_request" 
    | "task_assigned" 
    | "task_overdue" 
    | "funding_received" 
    | "funding_status" 
    | "new_message";
  referenceId?: string;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface FileCommitDoc {
  _id: string;
  startupId: string;
  departmentId: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploaderName: string;
  commitMessage: string;
  version: number;
  createdAt: string;
}

export interface SessionUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  theme?: "light" | "dark";
}
