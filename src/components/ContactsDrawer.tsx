'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  User,
  MessageSquare,
  Globe2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ContactThread, SpanishDialect, ConversationTone } from '@/types';

interface ContactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ContactThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onCreateThread: (name: string, note?: string, dialect?: SpanishDialect) => void;
  onDeleteThread: (id: string) => void;
  onUpdateThread: (id: string, updates: Partial<ContactThread>) => void;
}

export const ContactsDrawer: React.FC<ContactsDrawerProps> = ({
  isOpen,
  onClose,
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  onUpdateThread,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newDialect, setNewDialect] = useState<SpanishDialect>('spain');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewName('');
    setNewNote('');
    setNewDialect('spain');
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateThread(newName.trim(), newNote.trim(), newDialect);
    setIsCreating(false);
  };

  const handleStartEdit = (t: ContactThread) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditNote(t.note || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateThread(id, { name: editName.trim(), note: editNote.trim() });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-md flex-col bg-slate-950 border-l border-slate-800 shadow-2xl animate-slide-up sm:animate-none">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              جهات الاتصال والمحادثات (Chat Threads)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Create New Thread Button */}
          {!isCreating ? (
            <button
              onClick={handleStartCreate}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة شخص / محادثة جديدة (Add Contact)</span>
            </button>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSaveCreate} className="rounded-xl border border-slate-800 bg-slate-900 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">محادثة جديدة</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">اسم الشخص أو المحادثة *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madrid Coworker, Crush, Carlos..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  ملاحظة السياق والجنس (Context & Gender Note)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Female, met on Instagram, romantic tone, lives in Valencia"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  تساعد الذكاء الاصطناعي على ضبط قواعد التذكير والتأنيث بدقة 100%.
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">اللهجة الإسبانية المفضلة</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDialect('spain')}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                      newDialect === 'spain'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    🇪🇸 Spain (إسبانيا)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDialect('latam')}
                    className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                      newDialect === 'latam'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    🌎 LatAm (أمريكا اللاتينية)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                حفظ وإنشاء المحادثة
              </button>
            </form>
          )}

          {/* List of Existing Threads */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
              المحادثات المحفوظة ({threads.length})
            </span>

            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const isEditing = editingId === thread.id;

              return (
                <div
                  key={thread.id}
                  className={`group relative rounded-xl border p-3 transition ${
                    isActive
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md'
                      : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Context note / gender / relationship"
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSaveEdit(thread.id)}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                        >
                          <Check className="h-3 w-3" /> حفظ
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-slate-400 hover:underline"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Top: Name & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            onSelectThread(thread.id);
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-sm">
                              {thread.name}
                            </span>
                            {isActive && (
                              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                                نشطة
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{thread.dialect === 'spain' ? '🇪🇸 Spain' : '🌎 LatAm'}</span>
                            <span>•</span>
                            <span>{thread.messages.length} رسالة</span>
                          </div>

                          {thread.note && (
                            <p className="mt-1.5 text-[11px] text-slate-400 italic line-clamp-2">
                              📝 {thread.note}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(thread)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            title="Edit Contact"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {threads.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف محادثة "${thread.name}"؟`)) {
                                  onDeleteThread(thread.id);
                                }
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                              title="Delete Thread"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-800 p-3 bg-slate-900/60 text-center text-xs text-slate-400">
          يتم حفظ جميع جهات الاتصال والملاحظات بأمان محلياً في جهازك.
        </div>
      </div>
    </div>
  );
};
