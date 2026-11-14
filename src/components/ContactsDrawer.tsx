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
  Sparkles
} from 'lucide-react';
import { ContactThread } from '@/types';

interface ContactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ContactThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onCreateThread: (name: string, note?: string) => void;
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewName('');
    setNewNote('');
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateThread(newName.trim(), newNote.trim());
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
      <div className="flex h-full w-full max-w-sm flex-col bg-slate-950 border-l border-slate-800 shadow-2xl animate-slide-up sm:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-3.5">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">
              المحادثات (Chats)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {!isCreating ? (
            <button
              onClick={handleStartCreate}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-500/50 bg-emerald-500/10 py-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
            >
              <Plus className="h-4 w-4" />
              <span>محادثة جديدة (New Chat)</span>
            </button>
          ) : (
            <form onSubmit={handleSaveCreate} className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">إضافة محادثة</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">اسم الشخص أو المحادثة *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madrid Friend, Crush, Carlos..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  ملاحظة السياق والجنس (Context Note)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Female, Instagram friend, romantic vibe"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
              >
                إنشاء المحادثة
              </button>
            </form>
          )}

          {/* Threads list */}
          <div className="space-y-1.5">
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              const isEditing = editingId === thread.id;

              return (
                <div
                  key={thread.id}
                  className={`rounded-xl border p-2.5 transition ${
                    isActive
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-900'
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
                        placeholder="Context note"
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
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex-1 cursor-pointer truncate"
                        onClick={() => {
                          onSelectThread(thread.id);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-100 text-xs truncate">
                            {thread.name}
                          </span>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          )}
                        </div>
                        {thread.note && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {thread.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(thread)}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        {threads.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm(`حذف محادثة "${thread.name}"؟`)) {
                                onDeleteThread(thread.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
