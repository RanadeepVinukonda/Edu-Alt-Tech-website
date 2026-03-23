
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle, ArrowRight } from 'lucide-react';
import { LINKS } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-white pt-20 pb-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#90EE90] rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-900 text-lg italic">E</span>
              </div>
              <span className="font-bold text-xl tracking-tight">Edu Alt Tech</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Bridging the execution gap through peer-driven education, accountability, and human-first systems.
            </p>
            <div className="flex gap-4">
              <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-emerald-600 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 rounded-full hover:bg-emerald-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Company</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/#about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link to="/team" className="hover:text-emerald-400 transition-colors">Leadership Team</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Resources</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li><Link to="/enroll" className="hover:text-emerald-400 transition-colors">Enroll</Link></li>
              <li><a href={LINKS.whatsapp} target="_blank" className="hover:text-emerald-400 transition-colors">WhatsApp Community</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-slate-200">Newsletter</h4>
            <p className="text-slate-400 text-sm mb-4">Stay updated on the future of alternative education.</p>
            <div className="flex">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-slate-800 border-none rounded-l-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-emerald-500" 
              />
              <button className="bg-[#90EE90] text-slate-900 px-4 py-2 rounded-r-lg hover:bg-emerald-400 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Edu Alt Tech. All rights reserved.
          </p>
          <p className="text-slate-500 text-xs italic">
            Built with purpose. Designed for disciplined learners.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
