import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';

import { MessageCircle, Send, Sparkles, Loader2, BookOpen, AlertCircle, Paperclip, Plus } from 'lucide-react';
import { createChatSession, sendChatMessage, fetchChatHistory, uploadChatFile } from '../api';
import { Link } from 'react-router-dom';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  cited_resource_ids?: number[];
  attached_file_uri?: string;
  attached_file_mime?: string;
  created_at: string;
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5 } },
  exit:    { opacity: 0, transition: { duration: 0.3 } },
};

export default function StudyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ uri: string, mime: string, name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialise session
  useEffect(() => {
    (async () => {
      try {
        const session = await createChatSession();
        setSessionId(session.id || session.session_id);
        setBackendAvailable(true);
      } catch {
        setBackendAvailable(false);
      }
    })();
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = async () => {
    try {
      setMessages([]);
      setAttachedFile(null);
      const session = await createChatSession();
      setSessionId(session.id || session.session_id);
    } catch {
      setError('Failed to start new chat');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const res = await uploadChatFile(file);
      setAttachedFile({ uri: res.file_uri, mime: res.mime_type, name: file.name });
    } catch (err) {
      setError('Failed to upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || sending || !sessionId) return;
    const userMsg = input.trim();
    const fileToSend = attachedFile;

    setInput('');
    setAttachedFile(null);
    setSending(true);
    setError(null);

    // Optimistic user message
    const tempUser: Message = {
      id: Date.now(),
      role: 'user',
      content: userMsg || 'Attached a file',
      attached_file_uri: fileToSend?.uri,
      attached_file_mime: fileToSend?.mime,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUser]);

    try {
      const reply = await sendChatMessage(sessionId, userMsg, fileToSend?.uri, fileToSend?.mime);
      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: reply.content || reply.message,
        cited_resource_ids: reply.cited_resource_ids,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setError('Failed to get a reply. The AI chat backend may not be running yet.');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      variants={pageVariants as any}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-5xl mx-auto px-4 py-10 pb-24 flex flex-col"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}
          >
            Ask Your Library
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            Ask anything and get grounded answers sourced directly from your study archive.
          </p>
        </div>
        <button
          onClick={startNewChat}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150"
          style={{
            backgroundColor: 'var(--noto-surface-alt)',
            color: 'var(--noto-text-primary)',
            border: '1px solid var(--noto-border)'
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--noto-primary)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--noto-border)')}
        >
          <Plus size={16} /> New Chat
        </button>
      </div>



      {/* Messages area */}
      <div
        className="flex-1 rounded-[var(--noto-radius-xl)] border overflow-hidden flex flex-col mb-4"
        style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', minHeight: 420 }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-primary)' }}
            >
              <MessageCircle size={24} />
            </div>
            <p className="font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Start a conversation
            </p>
            <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
              Ask about any topic in your study materials. Answers are cited from your library.
            </p>

            {/* Quick starters */}
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {[
                'Explain quadratic equations',
                'What is Newton\'s third law?',
                'Summarise photosynthesis',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs px-3 py-1.5 rounded-full border transition-colors duration-150"
                  style={{
                    borderColor: 'var(--noto-border)',
                    color: 'var(--noto-text-secondary)',
                    backgroundColor: 'var(--noto-surface-alt)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[80%] px-4 py-3 rounded-[var(--noto-radius-lg)] text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? { backgroundColor: 'var(--noto-primary)', color: '#ffffff' }
                        : { backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-primary)', border: '1px solid var(--noto-border)' }
                    }
                  >
                    {msg.attached_file_uri && (
                      <div className="mb-2 flex items-center gap-1.5 opacity-80 text-xs">
                        <Paperclip size={12} /> File Attached
                      </div>
                    )}
                    <MarkdownRenderer content={msg.content} />

                    {/* Citation chips */}
                    {msg.cited_resource_ids && msg.cited_resource_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                        {msg.cited_resource_ids.map(rid => (
                          <Link
                            key={rid}
                            to={`/resources/${rid}`}
                            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-100"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.15)',
                              color: '#ffffff',
                            }}
                          >
                            <BookOpen size={10} /> Source #{rid}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sending && (
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 rounded-[var(--noto-radius-lg)] flex items-center gap-2 text-sm"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', color: 'var(--noto-text-secondary)' }}
                >
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--noto-primary)' }} />
                  Thinking…
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-5 py-3 border-t text-xs" style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-danger)' }}>
            {error}
          </div>
        )}

        {/* Attachment Pill */}
        {attachedFile && (
          <div className="px-4 pt-3 flex items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-150" 
              style={{ backgroundColor: 'var(--noto-surface-alt)', border: '1px solid var(--noto-primary)', color: 'var(--noto-primary)' }}>
              <Paperclip size={12} /> {attachedFile.name}
              <button onClick={() => setAttachedFile(null)} className="ml-1 hover:text-[var(--noto-danger)] transition-colors">
                &times;
              </button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t p-4" style={{ borderColor: 'var(--noto-border)' }}>
          <div className="flex gap-3 items-center">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*,.pdf,.txt" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-3 rounded-full border transition-all duration-200"
              style={{
                backgroundColor: 'var(--noto-surface-alt)',
                borderColor: 'var(--noto-border)',
                color: 'var(--noto-text-secondary)',
                opacity: uploading ? 0.5 : 1
              }}
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder={uploading ? "Uploading file..." : "Ask a question..."}
              disabled={uploading}
              className="flex-1 px-4 py-3 rounded-[var(--noto-radius-lg)] text-sm border focus:outline-none transition-colors"
              style={{
                backgroundColor: 'var(--noto-surface-alt)',
                borderColor: 'var(--noto-border)',
                color: 'var(--noto-text-primary)'
              }}
            />
            <button
              onClick={handleSend}
              disabled={sending || (!input.trim() && !attachedFile) || uploading}
              className="p-3 rounded-[var(--noto-radius-lg)] transition-colors duration-200"
              style={{
                backgroundColor: (input.trim() || attachedFile) && !sending && !uploading ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
                color: (input.trim() || attachedFile) && !sending && !uploading ? '#ffffff' : 'var(--noto-text-secondary)',
                border: '1px solid',
                borderColor: (input.trim() || attachedFile) && !sending && !uploading ? 'var(--noto-primary)' : 'var(--noto-border)',
              }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
