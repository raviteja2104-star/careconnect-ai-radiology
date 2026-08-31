'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageCircle, Search, Send, Paperclip, Phone, Video, Plus, Languages,
} from 'lucide-react';
import {
  PageHeader,
  Avatar,
  Badge,
  Button,
  Input,
} from '@/components/ui';

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
  const router = useRouter();
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
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[540px] flex-col space-y-6">
      <PageHeader
        title="Messages"
        description="Secure clinical messaging with patients, care teams and departments."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Messages' }]}
        className="mb-0"
      />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {/* Left rail: conversation inbox */}
        <div className="flex w-80 shrink-0 flex-col border-r border-border bg-muted/30 md:w-96">
          <div className="space-y-3 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-base font-bold text-foreground">CareConnect Messaging</h2>
              </div>
              <Button
                size="icon-sm"
                variant="primary"
                onClick={() => alert('Starting new clinical chat thread...')}
                aria-label="Start new chat thread"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Input
              icon={<Search />}
              type="text"
              placeholder="Search doctors, patients, wards…"
              aria-label="Search conversations"
              className="h-9"
            />
          </div>

          <div className="scrollbar-thin flex-1 divide-y divide-border overflow-y-auto" role="list" aria-label="Conversations">
            {channels.map(ch => (
              <button
                key={ch.id}
                role="listitem"
                onClick={() => setActiveChannel(ch.id)}
                aria-current={activeChannel === ch.id ? 'true' : undefined}
                className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                  activeChannel === ch.id
                    ? 'border-l-2 border-primary bg-card shadow-soft'
                    : 'border-l-2 border-transparent hover:bg-muted/60'
                }`}
              >
                <Avatar name={ch.name} size="md" status={ch.unread > 0 ? 'online' : undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`truncate text-sm ${ch.unread > 0 ? 'font-bold text-foreground' : 'font-semibold text-foreground'}`}>
                      {ch.name}
                    </h4>
                    <span className="shrink-0 text-[11px] text-subtle-foreground">{ch.time}</span>
                  </div>
                  <p className={`mt-0.5 truncate text-xs ${ch.unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                    {ch.lastMsg}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                      <Languages className="h-3 w-3" aria-hidden /> {ch.lang}
                    </span>
                    {ch.unread > 0 && (
                      <Badge tone="brand" className="px-1.5 py-0 text-[10px]" aria-label={`${ch.unread} unread messages`}>
                        {ch.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right area: active thread */}
        <div className="flex min-w-0 flex-1 flex-col bg-card">
          {/* Thread header */}
          <div className="flex items-center justify-between gap-3 border-b border-border p-4">
            <div className="flex min-w-0 items-center gap-3">
              {selectedChannelInfo && <Avatar name={selectedChannelInfo.name} size="md" />}
              <div className="min-w-0">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="truncate">{selectedChannelInfo?.name}</span>
                  <Badge tone="brand" className="shrink-0 text-[10px]">{selectedChannelInfo?.lang}</Badge>
                </h3>
                <p className="truncate text-xs text-muted-foreground">{selectedChannelInfo?.role}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/telemedicine')}
              >
                <Video className="h-4 w-4" aria-hidden /> Start Video Call
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => alert(`Calling phone line for ${selectedChannelInfo?.name}...`)}
                aria-label={`Call ${selectedChannelInfo?.name}`}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages scroll view */}
          <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-muted/20 p-6">
            {(messages[activeChannel] || []).map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-subtle-foreground">
                  <span className="font-semibold text-muted-foreground">{msg.sender}</span>
                  <span>• {msg.time}</span>
                </div>

                <div
                  className={`max-w-lg space-y-1.5 rounded-2xl p-3.5 text-sm leading-relaxed shadow-soft ${
                    msg.isMe
                      ? 'rounded-br-md bg-primary text-primary-foreground'
                      : 'rounded-bl-md border border-border bg-card text-foreground'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.translatedText && (
                    <p className={`border-t pt-1.5 text-xs italic ${msg.isMe ? 'border-primary-foreground/20 opacity-80' : 'border-border text-muted-foreground'}`}>
                      {msg.translatedText}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Composer */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-border p-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => alert('Attaching Lab Report / EMR File...')}
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message or clinical advice…"
              aria-label="Message"
              className="flex-1"
            />

            <Button type="submit" variant="primary">
              <Send className="h-4 w-4" aria-hidden /> Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
