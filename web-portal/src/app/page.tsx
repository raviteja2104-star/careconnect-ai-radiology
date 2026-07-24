'use client';

import React, { useState } from 'react';
import { Activity, Phone, Mail, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email'>('mobile');
  
  return (
    <div className="min-h-screen w-full flex bg-background relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
      
      {/* Left Column: Branding / Illustration (Visible on lg screens) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-float">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-text-primary tracking-tight">CareConnect</span>
          </div>
        </div>
        
        <div className="max-w-lg mt-20">
          <h1 className="text-5xl font-bold text-text-primary leading-tight mb-6">
            Your Health,<br />Our Priority.
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed mb-10">
            Consult top doctors, book appointments, manage health records, and access comprehensive care—all in one secure platform.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <img 
                  key={i} 
                  src={`https://i.pravatar.cc/150?img=${i + 10}`} 
                  alt="Doctor" 
                  className="w-12 h-12 rounded-full border-2 border-background"
                />
              ))}
            </div>
            <div className="text-sm">
              <p className="font-semibold text-text-primary">Trusted by 10,000+ patients</p>
              <p className="text-text-secondary">Join the network today</p>
            </div>
          </div>
        </div>
        
        <div className="text-text-secondary text-sm">
          © 2026 CareConnect Enterprise
        </div>
      </div>
      
      {/* Right Column: Login Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 z-10 relative">
        <div className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-10">
          
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-float">
              <Activity className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-text-primary tracking-tight">CareConnect</span>
          </div>

          <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome Back!</h2>
          <p className="text-text-secondary mb-8">Please enter your details to sign in.</p>
          
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button 
              onClick={() => setLoginMethod('mobile')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'mobile' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Mobile Number
            </button>
            <button 
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${loginMethod === 'email' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary'}`}
            >
              Email Address
            </button>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            
            {loginMethod === 'mobile' ? (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Mobile Number</label>
                <div className="flex gap-3">
                  <div className="w-20 h-12 border border-border rounded-xl flex items-center justify-center bg-white font-medium text-text-primary shadow-sm">
                    +91
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input 
                      type="tel" 
                      className="w-full h-12 bg-white border border-border rounded-xl pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                      placeholder="98765 43210"
                    />
                  </div>
                </div>
              </div>
            ) : (
               <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                      <input 
                        type="email" 
                        className="w-full h-12 bg-white border border-border rounded-xl pl-10 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                        placeholder="patient@careconnect.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Password</label>
                    <input 
                      type="password" 
                      className="w-full h-12 bg-white border border-border rounded-xl px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
                      placeholder="••••••••"
                    />
                  </div>
               </div>
            )}
            
            <button className="w-full h-12 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] mt-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
            
          </form>

          <div className="mt-8 flex items-center justify-between text-sm">
            <a href="#" className="text-primary font-medium hover:underline">Forgot Password?</a>
            <div className="text-text-secondary">
              New patient? <a href="#" className="text-primary font-medium hover:underline">Sign up</a>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-text-secondary">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Secure, HIPAA-compliant connection</span>
          </div>

        </div>
      </div>
    </div>
  );
}
