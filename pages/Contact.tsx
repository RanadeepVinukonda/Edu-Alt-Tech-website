
import React from 'react';
import { Mail, Phone, Instagram, MessageCircle, Send } from 'lucide-react';
import { LINKS } from '../constants';

const Contact: React.FC = () => {
  return (
    <div className="pt-32 pb-24 px-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">Get in Touch</h1>
          <p className="text-slate-500 text-xl max-w-2xl mx-auto">
            Have questions about our peer-driven ecosystem? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Info Side */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Email us</p>
                  <p className="text-slate-900 font-bold break-all">ukkukk97@gmail.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Call us</p>
                  <p className="text-slate-900 font-bold">+91 91215 05879</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Connect with us</p>
                <div className="flex gap-4">
                  <a href={LINKS.whatsapp} target="_blank" className="flex items-center gap-3 p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-colors w-full justify-center">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-bold">WhatsApp</span>
                  </a>
                  <a href={LINKS.instagram} target="_blank" className="flex items-center gap-3 p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors w-full justify-center">
                    <Instagram className="w-5 h-5" />
                    <span className="font-bold">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-8">
            <div className="bg-white p-10 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200">
              <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                    <input 
                      type="text" 
                      placeholder="Your name"
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                  <textarea 
                    placeholder="How can we help you?"
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-[#90EE90] outline-none transition-all h-40 resize-none"
                  />
                </div>
                <button className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2 text-lg">
                  Send Message <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
