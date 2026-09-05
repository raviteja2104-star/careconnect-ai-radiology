'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  EmptyState,
  SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

interface Channel {
  id: string;
  name: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: number;
  lang: string;
}

interface Message {
  id: string;
  sender: string;
  role: string;
  text: string;
  translatedText?: string;
  time: string;
  isMe: boolean;
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getCurrentUser(): { id: string; name: string } {
  try {
    if (typeof window !== 'undefined') {
      const u = JSON.parse(localStorage.getItem('cc-user') || '{}');
      return { id: u._id || u.id || '', name: u.name || 'Me' };
    }
  } catch {}
  return { id: '', name: 'Me' };
}

function mapChannel(raw: any): Channel {
  const lastMsg = raw.lastMessage?.text || raw.lastMessage?.content || (typeof raw.lastMessage === 'string' ? raw.lastMessage : '') || '';
  const updatedAt = raw.updatedAt || raw.lastMessage?.createdAt;
  return {
    id: raw._id || raw.id,
    name: raw.name || raw.subject || raw.participant?.name || 'Unknown',
    role: raw.role || raw.participant?.role || raw.type || '',
    lastMsg,
    time: updatedAt ? new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
    unread: raw.unread || raw.unreadCount || 0,
    lang: raw.lang || raw.language || 'English',
  };
}

function mapMessage(raw: any, currentUserId: string): Message {
  const senderId = raw.sender?._id || raw.sender?.id || raw.senderId || '';
  return {
    id: raw._id || raw.id || `msg-${Math.random()}`,
    sender: raw.sender?.name || raw.senderName || raw.from || 'Unknown',
    role: raw.sender?.role || raw.senderRole || '',
    text: raw.text || raw.content || raw.body || '',
    translatedText: raw.translatedText,
    time: raw.createdAt
      ? new Date(raw.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : raw.time || '',
    isMe: !!currentUserId && senderId === currentUserId,
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  const { data: channelsData, isLoading: channelsLoading } = useQuery({
    queryKey: ['communication', 'channels'],
    queryFn: () =>
      fetch(`${API_BASE}/api/communication/history`, { headers: getAuthHeader() }).then(r => r.json()),
    staleTime: 60000,
  });

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['communication', 'thread', activeChannel],
    queryFn: () =>
      fetch(`${API_BASE}/api/communication/history?threadId=${activeChannel}`, { headers: getAuthHeader() }).then(r => r.json()),
    enabled: !!activeChannel,
    staleTime: 30000,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { threadId: string; text: string; recipientId?: string }) =>
      fetch(`${API_BASE}/api/communication/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: () => {
      setOptimisticMessages([]);
      queryClient.invalidateQueries({ queryKey: ['communication', 'thread', activeChannel] });
      queryClient.invalidateQueries({ queryKey: ['communication', 'channels'] });
    },
  });

  const rawChannels: Channel[] = (() => {
    const list = channelsData?.data || channelsData?.threads || channelsData?.conversations || [];
    return Array.isArray(list) ? list.map(mapChannel) : [];
  })();

  const currentUser = getCurrentUser();
  const rawMessages: Message[] = (() => {
    const list = threadData?.data || threadData?.messages || [];
    return Array.isArray(list) ? list.map((m: any) => mapMessage(m, currentUser.id)) : [];
  })();

  const messages = [...rawMessages, ...optimisticMessages];
  const selectedChannelInfo = rawChannels.find(c => c.id === activeChannel);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender: currentUser.name,
      role: 'Me',
      text: inputText,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setOptimisticMessages(prev => [...prev, optimistic]);
    sendMutation.mutate({ threadId: activeChannel, text: inputText });
    setInputText('');
  };

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
                onClick={() => {}}
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
            {channelsLoading ? (
              <div className="p-4 space-y-3">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : rawChannels.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No conversations"
                description="Clinical messages will appear here once the messaging service is connected."
                className="p-8"
              />
            ) : (
              rawChannels.map(ch => (
                <button
                  key={ch.id}
                  role="listitem"
                  onClick={() => { setActiveChannel(ch.id); setOptimisticMessages([]); }}
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
              ))
            )}
          </div>
        </div>

        {/* Right area: active thread */}
        <div className="flex min-w-0 flex-1 flex-col bg-card">
          {!activeChannel ? (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={MessageCircle}
                title="Select a conversation"
                description="Choose a thread from the left to start messaging."
              />
            </div>
          ) : (
            <>
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
                    aria-label={`Call ${selectedChannelInfo?.name}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages scroll view */}
              <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-muted/20 p-6">
                {threadLoading ? (
                  <SkeletonCard />
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={MessageCircle}
                    title="No messages yet"
                    description="Send the first message in this conversation."
                  />
                ) : (
                  messages.map((msg, i) => (
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
                  ))
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-border p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Attach file"
                  disabled
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

                <Button type="submit" variant="primary" disabled={sendMutation.isPending || !inputText.trim()}>
                  <Send className="h-4 w-4" aria-hidden /> {sendMutation.isPending ? 'Sending…' : 'Send'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
