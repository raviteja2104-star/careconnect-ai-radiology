'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, SendHorizontal, ShieldCheck, Stethoscope, FlaskConical, CalendarClock, Pill } from 'lucide-react';
import { PageHeader, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  content: string;
}

const SUGGESTIONS = [
  { icon: FlaskConical, label: 'Summarize my recent lab reports' },
  { icon: Pill, label: 'Explain my current prescriptions' },
  { icon: CalendarClock, label: 'Book a follow-up with cardiology' },
  { icon: Stethoscope, label: 'What do my radiology findings mean?' },
];

// Mock canned responses — no backend is wired up yet.
const MOCK_REPLIES = [
  'I can help with that. Based on your records, everything in your most recent visit looks stable. Would you like a plain-language summary or the full clinical detail?',
  'Here is what I found in your health record. Your last three results are within normal ranges, and there are no pending action items from your care team.',
  'Good question. I have flagged this for context from your care history — in the full release I will pull the exact documents and walk you through them line by line.',
  'I have noted that. You can also ask me about appointments, prescriptions, lab results, or imaging reports any time.',
];

export default function aiassistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'Hello! I am your CareConnect health assistant. I can summarize records, explain results in plain language, and help you plan your care. How can I help today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const nextId = useRef(2);
  const replyIndex = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', content: trimmed }]);
    setInput('');
    setIsTyping(true);
    const reply = MOCK_REPLIES[replyIndex.current % MOCK_REPLIES.length];
    replyIndex.current += 1;
    setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', content: reply }]);
      setIsTyping(false);
    }, 1100);
  };

  const showSuggestions = messages.length <= 1 && !isTyping;

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title="AI Health Assistant"
        description="Ask questions about your records, results, and care plan — answered in plain language."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'AI Assistant' }]}
        actions={<Badge tone="brand" dot pulse>Beta</Badge>}
      />

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        {/* Conversation viewport */}
        <div
          ref={viewportRef}
          className="scrollbar-thin flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
          style={{ minHeight: '360px', maxHeight: 'calc(100dvh - 330px)' }}
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={cn('flex items-end gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'assistant' && (
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-soft">
                    <Sparkles className="h-4 w-4" aria-hidden />
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]',
                    message.role === 'user'
                      ? 'rounded-br-md bg-primary text-primary-foreground shadow-soft'
                      : 'rounded-bl-md border border-border bg-muted/60 text-foreground'
                  )}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-3"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-soft">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div className="rounded-2xl rounded-bl-md border border-border bg-muted/60 px-4 py-3.5" aria-label="Assistant is typing">
                <span className="flex items-center gap-1" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                </span>
              </div>
            </motion.div>
          )}

          {/* Suggestion chips */}
          {showSuggestions && (
            <div className="pt-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map(({ icon: Icon, label }, i) => (
                  <motion.button
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    onClick={() => sendMessage(label)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-soft transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating composer */}
        <div className="border-t border-border bg-card/80 p-4 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 rounded-2xl border border-input bg-background p-1.5 shadow-soft transition-shadow focus-within:shadow-float"
          >
            <label htmlFor="ai-assistant-input" className="sr-only">Message the assistant</label>
            <input
              id="ai-assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your health records, results, or care plan…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-subtle-foreground"
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim() || isTyping}>
              <SendHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </form>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] text-subtle-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            Responses are informational and not a substitute for advice from your care team.
          </p>
        </div>
      </div>
    </div>
  );
}
