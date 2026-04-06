import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';
import { Search, Book, Palette, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'education' | 'alternative'>('all');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetchedCourses);
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const gridRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!loading && courses.length > 0 && gridRef.current) {
      gsap.fromTo(gridRef.current.children,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%"
          }
        }
      );
    }
  }, [loading, activeFilter, searchTerm]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || course.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 bg-slate-50 dark:bg-slate-950 overflow-x-hidden w-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Explore Courses</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover a wide range of learning opportunities from traditional mainstream topics to alternative life skills.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm dark:text-white transition-shadow"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-center md:justify-start">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all ${activeFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              All Courses
            </button>
            <button 
              onClick={() => setActiveFilter('education')}
              className={`px-6 py-3 rounded-full font-medium whitespace-nowrap flex items-center gap-2 transition-all ${activeFilter === 'education' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Book className="w-4 h-4" /> Core Education
            </button>
            <button 
              onClick={() => setActiveFilter('alternative')}
              className={`px-6 py-3 rounded-full font-medium whitespace-nowrap flex items-center gap-2 transition-all ${activeFilter === 'alternative' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <Palette className="w-4 h-4" /> Alternative Skills
            </button>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" ref={gridRef}>
            {filteredCourses.map(course => (
              <div key={course.id} className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/30 transition-all duration-500 flex flex-col h-full transform hover:-translate-y-2">
                {course.thumbnailUrl ? (
                  <div className="w-full h-56 overflow-hidden relative border-b border-slate-100 dark:border-slate-800">
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 shadow border border-slate-200 dark:border-slate-700">
                      {course.category}
                    </div>
                  </div>
                ) : (
                  <div className={`w-full h-48 flex items-center justify-center p-6 border-b border-slate-100 dark:border-slate-800 ${course.category === 'education' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500'}`}>
                    <Book className="w-16 h-16 opacity-40 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                )}
                
                <div className="p-6 flex flex-col flex-grow relative">
                  {!course.thumbnailUrl && (
                    <div className={`mb-4 w-fit px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${course.category === 'education' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {course.category}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{course.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 flex-grow line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white text-lg">
                    {course.price === 0 || !course.price ? 'Free' : `₹${course.price}`}
                  </span>
                  <Link to={`/courses/${course.id}`} className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold group-hover:gap-2 transition-all">
                    View Details <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-xl text-slate-500 dark:text-slate-400">No courses found matching your criteria.</p>
            <button onClick={() => {setSearchTerm(''); setActiveFilter('all');}} className="mt-4 text-emerald-600 font-medium hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
