'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  MessageCircle, Search, Send, Paperclip, Phone, Video, 
  CheckCheck, User, Stethoscope, ShieldPlus, Pill, FileText, Globe, Mic, Plus
} from 'lucide-react';

interface Message {
  id: string;
  sender: string;
  role: string;
  text: string;
  translatedText?: string;
  time: string;
  isMe: boolean;
  attachment?: string;
}

export default function MessagesPage() {
  const [activeChannel, setActiveChannel] = useState('1');
  const [inputText, setInputText] = useState('');

  const channels = [
    { id: '1', name: 'Rohit Sharma (Patient)', role: 'Patient | UHID: PT-0001234', lastMsg: 'Doctor, when should I take the evening dose?', time: '10:42 AM', unread: 2, lang: 'Telugu (తెలుగు)' },
    { id: '2', name: 'Emergency Trauma & Resuscitation', role: 'ICU / ER Team Broadcast', lastMsg: 'STAT: Male 45Y incoming with acute STEMI', time: '10:30 AM', unread: 0, lang: 'English' },
    { id: '3', name: 'Dr. Ananya Roy (Cardiology)', role: 'Senior Consultant', lastMsg: 'Echo report attached for bed 12.', time: 'Yesterday', unread: 0, lang: 'English' },
    { id: '4', name: 'In-Patient Pharmacy Desk', role: 'Clinical Pharmacy', lastMsg: 'Apixaban 5mg stock updated.', time: '23 Jul', unread: 0, lang: 'English' }
  ];

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      { id: 'm1', sender: 'Dr. Raj Sharma', role: 'Doctor', text: 'Good morning Rohit. Please share your morning blood pressure readings.', time: '10:30 AM', isMe: true },
      { id: 'm2', sender: 'Rohit Sharma', role: 'Patient', text: 'నమస్కారం డాక్టర్. నా ఉదయం రక్తపోటు 128/84 ఉంది. మధ్యాహ్నం మందులు ఎప్పుడు వేసుకోవాలి?', translatedText: '(English: Hello Doctor. My morning BP is 128/84. When should I take afternoon meds?)', time: '10:35 AM', isMe: false },
      { id: 'm3', sender: 'Dr. Raj Sharma', role: 'Doctor', text: 'BP is normal. Take Metformin 500mg right after lunch with water.', time: '10:40 AM', isMe: true },
      { id: 'm4', sender: 'Rohit Sharma', role: 'Patient', text: 'ధన్యవాదాలు డాక్టర్. మలబద్ధకం కోసం ఏమైనా మందులు వాడవచ్చా?', translatedText: '(English: Thank you doctor. Can I take anything for constipation?)', time: '10:42 AM', isMe: false }
    ],
    '2': [
      { id: 'm10', sender: 'Nurse Desk', role: 'Triage Nurse', text: 'STAT Alert: EMS Ambulance arriving in 5 mins. Patient in anaphylactic shock.', time: '10:28 AM', isMe: false }
    ]
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'Dr. Raj Sharma',
      role: 'Doctor',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg]
    }));

    setInputText('');
  };

  const selectedChannelInfo = channels.find(c => c.id === activeChannel);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex-1 flex overflow-hidden">
          
          {/* Left Sidebar: Conversations list */}
          <div className="w-80 md:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">CareConnect Messaging</h2>
                </div>
                <button 
                  onClick={() => alert('Starting new clinical chat thread...')}
                  className="p-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search doctors, patients, wards..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-all ${
                    activeChannel === ch.id
                      ? 'bg-white dark:bg-slate-900 shadow-2xs border-l-4 border-indigo-600'
                      : 'hover:bg-slate-100/60 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold rounded-2xl flex items-center justify-center shrink-0">
                    {ch.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{ch.name}</h4>
                      <span className="text-[10px] text-slate-400">{ch.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{ch.lastMsg}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold">{ch.lang}</span>
                      {ch.unread > 0 && (
                        <span className="w-4 h-4 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {ch.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Area: Active Message Thread */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center">
                  {selectedChannelInfo?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedChannelInfo?.name}
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold rounded-md">
                      {selectedChannelInfo?.lang}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">{selectedChannelInfo?.role}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Initiating Teleconsultation Video Call with ${selectedChannelInfo?.name}...`)}
                  className="p-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-all"
                >
                  <Video className="w-4 h-4" /> Start Video Call
                </button>
                <button
                  onClick={() => alert(`Calling phone line for ${selectedChannelInfo?.name}...`)}
                  className="p-2 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll View */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-slate-950/20">
              {(messages[activeChannel] || []).map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-slate-600 dark:text-slate-300">{msg.sender}</span>
                    <span>• {msg.time}</span>
                  </div>

                  <div className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-2xs ${
                    msg.isMe
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}>
                    <p>{msg.text}</p>
                    {msg.translatedText && (
                      <p className="text-[11px] opacity-80 pt-1 border-t border-slate-200 dark:border-slate-700 italic">
                        {msg.translatedText}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert('Attaching Lab Report / EMR File...')}
                className="p-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message or clinical advice..."
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none text-slate-900 dark:text-white"
              />

              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </form>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
