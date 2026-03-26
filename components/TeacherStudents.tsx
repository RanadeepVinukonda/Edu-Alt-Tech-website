import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { Course, UserObject, Enrollment, Attendance } from '../types';
import { Loader2, Users, UserCheck } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  user: User;
  courses: Course[];
}

interface StudentWithDetails {
  uid: string;
  name: string;
  email: string;
  courseTitle: string;
  enrolledAt: any;
  attendancePresent: number;
}

const TeacherStudents: React.FC<Props> = ({ user, courses }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithDetails[]>([]);

  useEffect(() => {
    if (courses.length === 0) {
      setLoading(false);
      return;
    }

    const courseIds = courses.map(c => c.id);
    
    const chunkedCourseIds = [];
    for (let i = 0; i < courseIds.length; i += 10) {
      chunkedCourseIds.push(courseIds.slice(i, i + 10));
    }

    let allEnrollments: any[] = [];
    let unsubscribes: any[] = [];

    const handleData = async () => {
      const studentMap = new Map<string, StudentWithDetails>();
      
      for (const enrollment of allEnrollments) {
        if (!studentMap.has(enrollment.id)) {
          // Fetch student details
          const userDoc = await getDoc(doc(db, 'users', enrollment.studentId));
          const userData = userDoc.data() as UserObject | undefined;
          
          if (userData) {
            const courseTitle = courses.find(c => c.id === enrollment.courseId)?.title || 'Unknown Course';
            
            studentMap.set(enrollment.id, {
              uid: userData.uid,
              name: userData.name,
              email: userData.email,
              courseTitle,
              enrolledAt: enrollment.enrolledAt,
              attendancePresent: 0
            });
          }
        }
      }
      
      setStudents(Array.from(studentMap.values()));
      setLoading(false);
    };
    chunkedCourseIds.forEach(chunk => {
      const q = query(collection(db, 'enrollments'), where('courseId', 'in', chunk));
      const unsub = onSnapshot(q, (snapshot) => {
        const newEnrollments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment));
        
        // Update allEnrollments replacing old ones from this chunk
        allEnrollments = [
          ...allEnrollments.filter(e => !chunk.includes(e.courseId)),
          ...newEnrollments
        ];
        
        handleData();
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [courses]);

  // Fetch mock or real attendance (simplified for scope: we'd ideally query attendance collection per student)
  
  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
        Students & Attendance
      </h2>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900">Enrolled Roster</h3>
          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{students.length} Total</div>
        </div>
        
        {students.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No students enrolled yet</h3>
            <p className="text-slate-400 max-w-sm">Share your course links to get students to enroll in your classes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Student Name</th>
                  <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Course</th>
                  <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Enrolled On</th>
                  <th className="p-6 font-bold text-slate-400 uppercase text-xs tracking-widest border-b border-slate-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 border-b border-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700 font-bold uppercase">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{student.name}</span>
                          <span className="text-xs text-slate-500">{student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 border-b border-slate-50 text-slate-600 font-medium">
                      {student.courseTitle}
                    </td>
                    <td className="p-6 border-b border-slate-50 text-sm text-slate-500">
                      {student.enrolledAt ? new Date(student.enrolledAt.toDate()).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-6 border-b border-slate-50">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full flex items-center gap-1 w-max">
                        <UserCheck className="w-3 h-3" /> Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;