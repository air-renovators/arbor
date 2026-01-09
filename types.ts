export interface GoalSection {
  question: string;
  answer: string;
}

export interface ActionStep {
  id: string;
  text: string;
  completed: boolean;
  date?: string; // Due Date
  time?: string; // Time
  days?: string; // e.g. "Mon, Wed, Fri"
  frequency?: 'Once' | 'Daily' | 'Weekly' | 'Monthly';
  successCriteria?: string; // "This step has been accomplished when..."
}

export interface EvaluationDetails {
  specific: {
    who: boolean;
    what: boolean;
    where: boolean;
    when: boolean;
    why: boolean;
    requirements: boolean;
    constraints: boolean;
  };
  measurable: {
    amount: boolean;
    indicator: boolean;
  };
  actionable: {
    clearSteps: boolean;
    immediateAction: boolean;
  };
  realistic: {
    able: boolean;
    willing: boolean;
  };
  timeBound: {
    deadline: boolean;
    todayAction: boolean;
    routine: boolean;
  };
}

export interface EvaluationLog {
  id: string;
  date: number;
  type: 'SELF' | 'MENTOR';
  score: number;
  details: EvaluationDetails;
  feedback: string;
}

export interface Goal {
  id: string;
  title: string;
  category: 'Personal' | 'Spiritual' | 'Career' | 'Health' | 'Life Skills';
  
  // Structured answers for SMARTER sections
  specific: {
    what: string;
    who: string;
    where: string;
    when: string;
    why: string;
    requirements: string; // "Which? Requirements"
    constraints: string; // "Which? Constraints"
  };
  measurable: {
    amount: string;
    indicator: string;
  };
  actionable: {
    steps: ActionStep[];
  };
  realistic: {
    willing: boolean;
    able: boolean;
    notes: string;
  };
  timeBound: {
    startDate: string;
    dueDate: string;
    routine: string;
  };
  
  evaluation: {
    frequency: 'Monthly' | 'Quarterly' | 'Weekly';
    history: EvaluationLog[];
    targetScore?: number;
  };

  progress: number; // 0-100
  createdAt: number;
}

export interface BibleNote {
  id: string;
  reference: string;
  text: string;
  note: string;
  date: string;
  isFavorite?: boolean;
}

export interface Decision {
  id: string;
  title: string;
  step: number; // 1-7
  data: {
    [key: string]: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface LifePlanSection {
  id: string;
  category: string;
  title: string;
  prompt: string;
  response: string;
  lastUpdated: number;
}

export type UserRole = 'MENTEE' | 'MENTOR';

export interface UserProfile {
  name: string;
  surname?: string;
  role: UserRole;
  joinedAt: number;
  birthday?: string;
  career?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface SavedQuote {
  id: string;
  text: string;
  author: string;
  dateSaved: number;
}

export interface MentorMeeting {
  id: string;
  date: string;
  time: string;
  topic: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  LIFE_PLAN = 'LIFE_PLAN',
  GOALS = 'GOALS',
  DECISIONS = 'DECISIONS',
  BIBLE = 'BIBLE',
  MENTORSHIP = 'MENTORSHIP',
  COMMUNITY = 'COMMUNITY',
  CALENDAR = 'CALENDAR',
  PROFILE = 'PROFILE',
}