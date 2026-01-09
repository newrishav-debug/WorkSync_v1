import React, { useState, useMemo } from 'react';
import { CalendarEvent } from '../types';
import EventDetailModal from './EventDetailModal';
import { ChevronLeft, ChevronRight, Clock, Plus, Upload, CheckSquare, X } from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'meeting' as CalendarEvent['type'],
    description: ''
  });

  // Helpers
  const formatDateKey = (d: Date) => {
    return d.toLocaleDateString('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getWeekDays = (d: Date) => {
    const weekStart = new Date(d);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  const currentWeekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const selectedDateKey = formatDateKey(selectedDate);
  const dayEvents = useMemo(() =>
    events
      .filter(e => e.date === selectedDateKey)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, selectedDateKey]
  );

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEvent.title,
      date: selectedDateKey,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      type: newEvent.type,
      description: newEvent.description,
      meetingNotes: '',
      momSent: false
    };

    onAddEvent(event);
    setIsModalOpen(false);
    setNewEvent({ title: '', startTime: '09:00', endTime: '10:00', type: 'meeting', description: '' });
  };

  const parseICSDate = (icsDate: string) => {
    if (!icsDate) return null;
    const isAllDay = icsDate.length === 8 && !icsDate.includes('T');
    if (isAllDay) {
      const year = icsDate.substring(0, 4);
      const month = icsDate.substring(4, 6);
      const day = icsDate.substring(6, 8);
      return { date: `${year}-${month}-${day}`, time: '09:00', isAllDay: true };
    }
    const tIndex = icsDate.indexOf('T');
    if (tIndex === -1) return null;
    const datePart = icsDate.substring(0, tIndex);
    const timePart = icsDate.substring(tIndex + 1).replace('Z', '');
    const year = parseInt(datePart.substring(0, 4));
    const month = parseInt(datePart.substring(4, 6)) - 1;
    const day = parseInt(datePart.substring(6, 8));
    const hour = parseInt(timePart.substring(0, 2));
    const minute = parseInt(timePart.substring(2, 4));
    const second = parseInt(timePart.substring(4, 6)) || 0;
    const isUTC = icsDate.endsWith('Z');
    let dateObj: Date;
    if (isUTC) { dateObj = new Date(Date.UTC(year, month, day, hour, minute, second)); }
    else { dateObj = new Date(year, month, day, hour, minute, second); }
    try {
      const laDateStr = dateObj.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' });
      const laTimeStr = dateObj.toLocaleTimeString('en-GB', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false });
      return { date: laDateStr, time: laTimeStr, isAllDay: false };
    } catch (e) {
      return { date: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`, time: `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`, isAllDay: false };
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const lines = content.split(/\r\n|\n|\r/);
      let inEvent = false; let currentEvent: any = {}; let importCount = 0;
      for (const line of lines) {
        if (line.startsWith('BEGIN:VEVENT')) { inEvent = true; currentEvent = {}; }
        else if (line.startsWith('END:VEVENT')) {
          inEvent = false;
          if (currentEvent.SUMMARY && currentEvent.DTSTART) {
            const start = parseICSDate(currentEvent.DTSTART);
            let end = currentEvent.DTEND ? parseICSDate(currentEvent.DTEND) : null;
            if (start) {
              if (!end) {
                const startH = parseInt(start.time.split(':')[0]);
                const endH = startH + 1;
                const endHStr = endH < 10 ? `0${endH}` : `${endH}`;
                end = { ...start, time: `${endHStr}:${start.time.split(':')[1]}` };
              }
              const existingEvent = events.find(e => e.title === currentEvent.SUMMARY && e.date === start.date && e.startTime === start.time && e.endTime === end.time);
              if (existingEvent) { onDeleteEvent(existingEvent.id); }
              onAddEvent({ id: crypto.randomUUID(), title: currentEvent.SUMMARY, description: currentEvent.DESCRIPTION || '', date: start.date, startTime: start.time, endTime: end.time, type: 'meeting', meetingNotes: '', momSent: false });
              importCount++;
            }
          }
        } else if (inEvent) {
          const separatorIndex = line.indexOf(':');
          if (separatorIndex > -1) {
            const rawKey = line.substring(0, separatorIndex);
            const value = line.substring(separatorIndex + 1);
            const key = rawKey.split(';')[0];
            if (key === 'SUMMARY') currentEvent.SUMMARY = value;
            else if (key === 'DESCRIPTION') currentEvent.DESCRIPTION = value;
            else if (key === 'DTSTART') currentEvent.DTSTART = value;
            else if (key === 'DTEND') currentEvent.DTEND = value;
            else if (key === 'LOCATION' && !currentEvent.DESCRIPTION) currentEvent.DESCRIPTION = value;
          }
        }
      }
      if (importCount > 0) alert(`Successfully imported ${importCount} events.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const navigateDate = (dir: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (view === 'daily') { newDate.setDate(newDate.getDate() + (dir === 'next' ? 1 : -1)); }
    else { newDate.setDate(newDate.getDate() + (dir === 'next' ? 7 : -7)); }
    setSelectedDate(newDate);
  };

  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const startDay = monthStart.getDay();
  const generateMiniCalendar = () => {
    const days = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800';
      case 'work': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'personal': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
    }
  };

  // Calculate event position and height based on duration
  const getEventStyle = (event: CalendarEvent) => {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = Math.max(endMinutes - startMinutes, 30); // Min 30 min

    // Each hour slot is 60px
    const topOffset = (startMin / 60) * 60; // Position within the hour slot
    const height = (durationMinutes / 60) * 60; // Height based on duration

    return {
      top: `${topOffset}px`,
      height: `${height}px`,
      minHeight: '24px'
    };
  };

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col md:flex-row gap-6 animate-fade-in overflow-hidden">
      <div className="w-full md:w-80 flex flex-col flex-shrink-0 gap-4 overflow-hidden h-full">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronLeft size={16} /></button>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{selectedDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'America/Los_Angeles' })}</span>
            <button onClick={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-slate-400 font-medium">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {generateMiniCalendar().map((day, i) => (
              <button key={i} disabled={day === null} onClick={() => { if (day) { const newD = new Date(selectedDate); newD.setDate(day); setSelectedDate(newD); } }} className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors ${day === null ? 'invisible' : ''} ${day === selectedDate.getDate() ? 'bg-indigo-600 text-white font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 mt-4 pr-1 custom-scrollbar">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide sticky top-0 bg-slate-50 dark:bg-slate-950 py-2">Agenda</h3>
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">No meetings scheduled.</div>
          ) : (
            dayEvents.map(event => (
              <div key={event.id} onClick={() => setSelectedEvent(event)} className={`p-3 rounded-lg border-l-4 shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:shadow-md transition-all ${event.type === 'meeting' ? 'border-l-indigo-500' : event.type === 'work' ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={12} /> {event.startTime} - {event.endTime}</span>
                  {event.momSent && <CheckSquare size={12} className="text-green-500" />}
                </div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-1">{event.title}</h4>
              </div>
            ))
          )}
          <button onClick={() => setIsModalOpen(true)} className="w-full py-2 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"><Plus size={16} /> Add Event</button>
          <label className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"><Upload size={14} /> Import ICS<input type="file" accept=".ics" className="hidden" onChange={handleFileUpload} /></label>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{view === 'daily' ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' }) : `Week View`}</h2>
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5">
              <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft size={18} className="text-slate-500" /></button>
              <button onClick={() => setSelectedDate(new Date())} className="px-3 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600">Today</button>
              <button onClick={() => navigateDate('next')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight size={18} className="text-slate-500" /></button>
            </div>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setView('daily')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'daily' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Daily</button>
            <button onClick={() => setView('weekly')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${view === 'weekly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Weekly</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
          {view === 'daily' ? (
            timeSlots.map(hour => (
              <div key={hour} className="grid grid-cols-[60px_1fr] border-b border-slate-100 dark:border-slate-800 min-h-[60px]">
                <div className="border-r border-slate-100 dark:border-slate-800 p-2 text-xs text-slate-400 text-right">{hour}:00</div>
                <div className="relative p-1">
                  {dayEvents.filter(e => parseInt(e.startTime.split(':')[0]) === hour).map(event => (
                    <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className={`absolute inset-x-1 p-2 rounded-md text-xs border shadow-sm cursor-pointer z-10 overflow-hidden ${getEventTypeColor(event.type)}`} style={getEventStyle(event)}>
                      <div className="font-bold flex items-center justify-between"><span className="truncate">{event.title}</span>{event.momSent && <CheckSquare size={10} />}</div>
                      <div className="text-[10px] opacity-75">{event.startTime} - {event.endTime}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[800px]">
              <div className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-10"></div>
              {currentWeekDays.map((day, i) => (
                <div key={i} className={`sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 border-l border-slate-100 dark:border-slate-800 p-2 text-center h-10 ${formatDateKey(day) === formatDateKey(new Date()) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">{day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' })}</div>
                  <div className={`text-xs ${formatDateKey(day) === formatDateKey(new Date()) ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>{day.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/Los_Angeles' })}</div>
                </div>
              ))}
              {timeSlots.map(hour => (
                <React.Fragment key={hour}>
                  <div className="border-r border-b border-slate-100 dark:border-slate-800 p-2 text-xs text-slate-400 text-right bg-slate-50/30 dark:bg-slate-800/30">{hour}:00</div>
                  {currentWeekDays.map((day, i) => {
                    const dateKey = formatDateKey(day);
                    const eventsForSlot = events.filter(e => e.date === dateKey && parseInt(e.startTime.split(':')[0]) === hour);
                    return (
                      <div key={i} className="border-b border-l border-slate-100 dark:border-slate-800 min-h-[60px] relative hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => setSelectedDate(day)}>
                        {eventsForSlot.map(event => {
                          const style = getEventStyle(event);
                          return (
                            <div key={event.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} className={`absolute mx-1 left-0 right-0 p-1 rounded text-[10px] font-medium border truncate shadow-sm z-10 overflow-hidden ${getEventTypeColor(event.type)}`} style={style} title={`${event.title} (${event.startTime}-${event.endTime})`}><span className="flex items-center gap-1">{event.momSent && <CheckSquare size={8} />} {event.title}</span></div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Add Event</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label><input type="text" required autoFocus className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start</label><input type="time" required className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">End</label><input type="time" required className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label><div className="flex gap-2">{['meeting', 'work', 'personal'].map(t => (<button key={t} type="button" onClick={() => setNewEvent({ ...newEvent, type: t as any })} className={`flex-1 py-1.5 text-xs font-bold rounded-md capitalize border transition-all ${newEvent.type === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>{t}</button>))}</div></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label><textarea rows={2} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} /></div>
              <div className="pt-2"><button type="submit" className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">Save Event</button></div>
            </form>
          </div>
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={onUpdateEvent}
          onDelete={onDeleteEvent}
        />
      )}
    </div>
  );
};

export default CalendarView;