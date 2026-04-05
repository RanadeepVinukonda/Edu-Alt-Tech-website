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

// Unified User Types
export type GlobalUserRole = 'admin';

export interface UserObject {
  uid: string;
  name: string;
  email: string;
  role?: GlobalUserRole;
  profilePic?: string;
  createdAt: any;
  preferences?: string[]; // E.g., 'jee-mains', 'music'
  classYear?: string;
  location?: string;
}

// Course Types
export type CourseCategory = 'education' | 'alternative';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  price?: number; // in INR, 0 = free
  createdAt: any;
  createdBy: string; // admin or system
}

// Enrollment / Application Types
export type StudentStatus = 'waitlisted' | 'active' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'not-required';

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  role: 'student' | 'teacher';
  
  // Student specific
  studentStatus?: StudentStatus;
  paymentStatus?: PaymentStatus;
  mentorId?: string; // Teacher's UID
  
  // Timestamps
  createdAt: any;
  updatedAt?: any;
  completedModules?: string[]; // IDs of completed roadmap modules
}

export type TeacherAppStatus = 'pending' | 'scheduled' | 'approved' | 'rejected';

export interface TeacherApplication {
  id: string; // Document ID
  userId: string;
  courseId: string;
  status: TeacherAppStatus;
  meetingLink?: string;
  meetingDate?: any;
  appliedAt: any;
  updatedAt?: any;
  
  // Mentor Profile Info
  userName?: string;
  userEmail?: string;
  experience?: string;
  skills?: string;
  message?: string;
  
  // Curriculum Path
  proposedPath?: string[];
}

export interface PathClass {
  id: string;              // unique ID for the class
  title: string;           // E.g., "Live Intro Session"
  meetingLink?: string;
  recordedLink?: string;
  createdAt?: any;
}

export interface Lecture {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  description: string;
  order: number;
  classes: PathClass[];    // Collection of classes inside this module
  createdAt: any;
  meetingLink?: string;
  recordedLink?: string;
}

export interface CourseResource {
  id: string;
  courseId: string;
  lectureId?: string; // Optional: If null, it's global for the course
  title: string;
  url: string;
  createdAt: any;
}

// System Updates
export interface PatchNote {
  id: string;
  version: string;
  title: string;
  content: string; // Markdown or rich text
  createdAt: any;
  createdBy: string; // Admin User ID
}

// LMS internal structs for when active
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
  teacherId: string; // Reference to the assigned mentor/teacher
  createdAt: any;
}

export interface Attendance {
  id: string; 
  classId: string;
  studentId: string;
  courseId: string;
  status: 'Present' | 'Absent';
  joinedAt: any;
}