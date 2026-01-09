import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../types';
import { Plus, StickyNote, Trash2, X, Tag, Search } from 'lucide-react';

interface NotesProps {
    notes: Note[];
    onAddNote: (note: Note) => void;
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (id: string) => void;
}

const Notes: React.FC<NotesProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string>('');
    const [newTagInput, setNewTagInput] = useState('');

    // Local editing state for auto-save
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    // Get all unique tags
    const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

    // Filter notes
    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = !filterTag || note.tags.includes(filterTag);
        return matchesSearch && matchesTag;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    // Sync local state when selected note changes
    useEffect(() => {
        if (selectedNote) {
            setEditTitle(selectedNote.title);
            setEditContent(selectedNote.content);
        }
    }, [selectedNoteId, selectedNote?.id]);

    // Auto-save function
    const saveNote = useCallback(() => {
        if (!selectedNote) return;

        const hasChanges = editTitle !== selectedNote.title || editContent !== selectedNote.content;
        if (!hasChanges) return;

        setIsSaving(true);
        const updatedNote: Note = {
            ...selectedNote,
            title: editTitle,
            content: editContent,
            updatedAt: new Date().toISOString()
        };
        onUpdateNote(updatedNote);
        setLastSaved(new Date());
        setTimeout(() => setIsSaving(false), 500);
    }, [selectedNote, editTitle, editContent, onUpdateNote]);

    // Debounced auto-save on content change
    useEffect(() => {
        if (!selectedNote) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for auto-save (1 second after last change)
        saveTimeoutRef.current = setTimeout(() => {
            saveNote();
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [editTitle, editContent, selectedNote?.id]);

    // Save on unmount or note switch
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    // Handle new note creation
    const handleNewNote = () => {
        const now = new Date().toISOString();
        const newNote: Note = {
            id: crypto.randomUUID(),
            title: '',
            content: '',
            tags: [],
            createdAt: now,
            updatedAt: now
        };

        onAddNote(newNote);
        setSelectedNoteId(newNote.id);
        setEditTitle('');
        setEditContent('');

        // Focus title input after a brief delay
        setTimeout(() => {
            titleInputRef.current?.focus();
        }, 100);
    };

    const handleAddTag = (noteId: string, tag: string) => {
        if (!tag.trim()) return;
        const note = notes.find(n => n.id === noteId);
        if (!note || note.tags.includes(tag.trim())) return;

        const updatedNote = {
            ...note,
            tags: [...note.tags, tag.trim()],
            updatedAt: new Date().toISOString()
        };
        onUpdateNote(updatedNote);
        setNewTagInput('');
    };

    const handleRemoveTag = (noteId: string, tagToRemove: string) => {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        const updatedNote = {
            ...note,
            tags: note.tags.filter(t => t !== tagToRemove),
            updatedAt: new Date().toISOString()
        };
        onUpdateNote(updatedNote);
    };

    const getTagColor = (tag: string) => {
        const colors = [
            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
            'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
        ];
        const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <StickyNote className="text-amber-500" />
                        Notes
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Capture and organize your thoughts.</p>
                </div>
                <button
                    onClick={handleNewNote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                    <Plus size={18} /> New Note
                </button>
            </div>

            {/* Main Content - Split Pane */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[600px] flex">

                {/* Left Pane - Note List */}
                <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
                    {/* Search & Filter */}
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {allTags.length > 0 && (
                            <select
                                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                                value={filterTag}
                                onChange={(e) => setFilterTag(e.target.value)}
                            >
                                <option value="">All Tags</option>
                                {allTags.map(tag => (
                                    <option key={tag} value={tag}>{tag}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Note List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredNotes.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <StickyNote size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notes found</p>
                            </div>
                        ) : (
                            filteredNotes.map(note => (
                                <button
                                    key={note.id}
                                    onClick={() => setSelectedNoteId(note.id)}
                                    className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${selectedNoteId === note.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''
                                        }`}
                                >
                                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{note.title || 'Untitled'}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 line-clamp-2">{note.content || 'No content'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-slate-400">{formatDate(note.updatedAt)}</span>
                                        {note.tags.length > 0 && (
                                            <div className="flex gap-1 flex-wrap">
                                                {note.tags.slice(0, 2).map(tag => (
                                                    <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded ${getTagColor(tag)}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                                {note.tags.length > 2 && (
                                                    <span className="text-[10px] text-slate-400">+{note.tags.length - 2}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Pane - Note Editor */}
                <div className="flex-1 flex flex-col">
                    {selectedNote ? (
                        <>
                            {/* Note Header */}
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    {isSaving ? (
                                        <span className="text-amber-500 animate-pulse">Saving...</span>
                                    ) : lastSaved ? (
                                        <span className="text-green-500">Saved</span>
                                    ) : (
                                        <span>Auto-save enabled</span>
                                    )}
                                </div>
                                <button
                                    onClick={() => {
                                        onDeleteNote(selectedNote.id);
                                        setSelectedNoteId(null);
                                    }}
                                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Delete note"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Note Editor */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                                <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full text-2xl font-bold bg-transparent border-none pb-4 focus:outline-none text-slate-800 dark:text-white placeholder-slate-400"
                                    placeholder="Note title..."
                                />
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-[400px] bg-transparent focus:outline-none resize-none text-slate-700 dark:text-slate-300 placeholder-slate-400"
                                    placeholder="Start writing..."
                                />
                            </div>

                            {/* Tags Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag size={14} className="text-slate-400" />
                                    {selectedNote.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getTagColor(tag)}`}
                                        >
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(selectedNote.id, tag)}
                                                className="hover:text-red-500 ml-1"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        placeholder="Add tag..."
                                        className="text-xs bg-transparent border border-dashed border-slate-300 dark:border-slate-600 rounded px-2 py-1 w-24 focus:outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddTag(selectedNote.id, newTagInput);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <StickyNote size={40} className="text-slate-300 dark:text-slate-600" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mb-4">Select a note to view</p>
                                <button
                                    onClick={handleNewNote}
                                    className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                                >
                                    or create a new note
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notes;
