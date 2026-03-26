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

// Mini LMS Specific Types
export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserObject {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  price?: number; // in INR, 0 = free
  createdAt: any;
}

export interface Subject {
  id: string;
  courseId: string;
  title: string;
  createdAt: any;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  createdAt: any;
}

export interface ClassSession {
  id: string;
  chapterId: string;
  subjectId: string;
  courseId: string;
  title: string;
  date: any;
  meetLink: string;
  type: 'Live' | 'Recorded';
  createdAt: any;
}

export interface Attendance {
  id: string; // `${classId}_${studentId}`
  classId: string;
  studentId: string;
  courseId: string;
  status: 'Present' | 'Absent';
  joinedAt: any;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: any;
}