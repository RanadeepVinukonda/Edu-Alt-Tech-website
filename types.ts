export interface TeamMember {
  name: string;
  role: string;
  phone: string;
  email: string;
  image: string;
  linkedin?: string;
}

export interface StatItem {
  label: string;
  value: number;
  suffix?: string;
}

export interface FeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Dashboard Specific Types
export interface DashboardFolder {
  id: string;
  name: string;
  createdAt: any;
}

export interface DashboardFile {
  id: string;
  name: string;
  folderId?: string;
  size: string;
  createdAt: any;
}

export interface DashboardNote {
  id: string;
  title: string;
  content?: string;
  createdAt: any;
}

export interface DashboardTeamMember {
  id: string;
  name: string;
  role?: string;
  createdAt: any;
}