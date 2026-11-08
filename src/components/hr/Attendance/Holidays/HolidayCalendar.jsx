import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  X,
  Flag,
  Church,
  Gift,
  Star,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

const groupHolidaysByDate = (holidays) => {
  const grouped = {};
  holidays.forEach((h) => {
    const date = h.date?.split('T')[0];
    if (date) {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(h);
    }
  });
  return grouped;
};

const formatDateKey = (year, month, day) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const DayCell = memo(({ day, dateKey, isToday, isSelected, hasHoliday, onClick, onHover, onLeave }) => {
  const [year, month, dayNum] = dateKey.split('-').map(Number);
  const weekday = new Date(year, month - 1, dayNum).getDay();
  const isSunday = weekday === 0;

  let textColorClass = 'text-gray-900';
  if (hasHoliday) {
    textColorClass = 'text-red-700';
  } else if (isSunday) {
    textColorClass = 'text-red-600';
  }

  let bgClass = '';
if (isSelected) {
  bgClass = 'bg-indigo-200 hover:bg-indigo-300';
} else if (hasHoliday) {
  bgClass = 'bg-red-200 hover:bg-red-100';
} else if (isToday) {
  bgClass = 'bg-teal-100 hover:bg-teal-200';
} else {
  bgClass = 'hover:bg-gray-50';
}

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`w-full h-full flex items-center justify-center rounded relative transition-all duration-100 border border-transparent text-[11px] font-semibold ${bgClass}`}
      title={hasHoliday ? '' : 'No holidays'}
    >
      <span className={textColorClass}>{day}</span>
    </button>
  );
});
DayCell.displayName = 'DayCell';

const HolidayPopover = ({ holidays, onClose }) => {
  const iconMap = { national: Flag, religious: Church, company: Gift };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.1 }}
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-2.5 min-w-[200px] max-w-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-primary-600" />
          {holidays.length} Event{holidays.length > 1 ? 's' : ''}
        </h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <ul className="space-y-1.5 max-h-48 overflow-y-auto">
        {holidays.map((h) => {
          const Icon = iconMap[h.type] || Star;
          return (
            <li key={h.holiday_id || h.id} className="text-[10px] border-b border-gray-100 pb-1.5 last:border-0 last:pb-0">
              <div className="flex items-center gap-1.5 font-medium text-gray-800">
                <Icon className="w-3 h-3 text-primary-600" />
                {h.name}
              </div>
              <div className="text-gray-500 text-[9px] flex flex-wrap gap-1 mt-0.5">
                <span className="bg-gray-100 px-1.5 py-0.5 rounded">{h.type}</span>
                {h.location && (
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" /> {h.location}
                  </span>
                )}
                {h.employee_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Users className="w-2.5 h-2.5" /> {h.employee_count}
                  </span>
                )}
                {h.description && <span className="italic text-gray-400">— {h.description}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
};

const HolidayCalendar = ({ year: initialYear, month: initialMonth, onDateSelect, onHolidayClick, fetchHolidays, showReminders = true, showDateDetails = true, refreshKey = 0 }) => {
  const [currentYear, setCurrentYear] = useState(initialYear || new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth !== undefined ? initialMonth : new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [holidaysForSelectedDate, setHolidaysForSelectedDate] = useState([]);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });

  const cache = useRef({});
  const [loading, setLoading] = useState(false);
  const [, setRefresh] = useState(false);

  const holidays = cache.current[`${currentYear}-${currentMonth}`] || [];

  const groupedHolidays = useMemo(() => groupHolidaysByDate(holidays), [holidays]);

  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return holidays
      .filter((h) => {
        const d = new Date(h.date);
        return d >= today && d <= nextWeek;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [holidays]);

  const fetchMonth = useCallback(async (year, month, silent = false) => {
    const key = `${year}-${month}`;
    if (cache.current[key]) return;
    if (typeof fetchHolidays !== 'function') return;
    try {
      if (!silent) setLoading(true);
      const result = await fetchHolidays(year, month);
      cache.current[key] = result;
      if (year === currentYear && month === currentMonth) {
        setRefresh((p) => !p);
      }
    } catch {
      if (!silent) toast.error('Failed to load holidays');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [fetchHolidays, currentYear, currentMonth]);

  useEffect(() => {
    fetchMonth(currentYear, currentMonth);
  }, [currentYear, currentMonth, refreshKey, fetchMonth]);

  useEffect(() => {
    const prefetch = (y, m) => fetchMonth(y, m, true);
    let prevY = currentYear, prevM = currentMonth - 1;
    if (prevM < 0) { prevM = 11; prevY--; }
    let nextY = currentYear, nextM = currentMonth + 1;
    if (nextM > 11) { nextM = 0; nextY++; }
    prefetch(prevY, prevM);
    prefetch(nextY, nextM);
  }, [currentYear, currentMonth, fetchMonth]);

  const goToPreviousMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((p) => p - 1);
    } else {
      setCurrentMonth((p) => p - 1);
    }
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((p) => p + 1);
    } else {
      setCurrentMonth((p) => p + 1);
    }
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  const handleMonthChange = (e) => setCurrentMonth(parseInt(e.target.value));
  const handleYearChange = (e) => setCurrentYear(parseInt(e.target.value));

  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentYear, currentMonth]);
  const firstDay = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentYear, currentMonth]);

  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDay, daysInMonth]);

  const isToday = useCallback((day) => {
    const today = new Date();
    return today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
  }, [currentYear, currentMonth]);

  const handleDayClick = useCallback((day) => {
    const dateKey = formatDateKey(currentYear, currentMonth, day);
    const holidaysOnDate = groupedHolidays[dateKey] || [];
    setSelectedDate(dateKey);
    setHolidaysForSelectedDate(holidaysOnDate);
    if (onHolidayClick) onHolidayClick(holidaysOnDate);
    if (onDateSelect) onDateSelect(dateKey);
  }, [currentYear, currentMonth, groupedHolidays, onHolidayClick, onDateSelect]);

  const handleDayMouseEnter = useCallback((day, event) => {
    const dateKey = formatDateKey(currentYear, currentMonth, day);
    const holidaysOnDate = groupedHolidays[dateKey] || [];
    if (holidaysOnDate.length > 0) {
      setHoveredDate(dateKey);
      const rect = event.currentTarget.getBoundingClientRect();
      setHoverPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  }, [currentYear, currentMonth, groupedHolidays]);

  const handleDayMouseLeave = useCallback(() => setHoveredDate(null), []);

  const closePopover = useCallback(() => {
    setSelectedDate(null);
    setHolidaysForSelectedDate([]);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPreviousMonth(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goToNextMonth(); }
      if (e.key === 't' || e.key === 'T') goToToday();
      if (e.key === 'Escape') closePopover();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPreviousMonth, goToNextMonth, goToToday, closePopover]);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const yearRange = useMemo(() => Array.from({ length: 21 }, (_, i) => currentYear - 10 + i), [currentYear]);

  const legendItems = [
    { label: 'National', type: 'national', icon: <Flag className="w-2.5 h-2.5" />, color: 'bg-orange-100 text-orange-700' },
    { label: 'Religious', type: 'religious', icon: <Church className="w-2.5 h-2.5" />, color: 'bg-purple-100 text-purple-700' },
    { label: 'Company', type: 'company', icon: <Gift className="w-2.5 h-2.5" />, color: 'bg-blue-100 text-blue-700' },
    { label: 'Regional', type: 'regional', icon: <MapPin className="w-2.5 h-2.5" />, color: 'bg-green-100 text-green-700' },
  ];

  const hoveredHolidays = hoveredDate ? groupedHolidays[hoveredDate] : [];

  const calendarContent = (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2.5 h-full flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-4 h-4 text-primary-600" />
          <div className="flex items-center gap-0.5">
            <select value={currentMonth} onChange={handleMonthChange} className="text-[10px] font-semibold border-gray-300 rounded px-1.5 py-0.5">
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx}>{name}</option>
              ))}
            </select>
            <select value={currentYear} onChange={handleYearChange} className="text-[10px] font-semibold border-gray-300 rounded px-1.5 py-0.5">
              {yearRange.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={goToPreviousMonth} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="w-3.5 h-3.5" /></button>
          <button onClick={goToToday} className="px-2 py-0.5 text-[9px] bg-primary-50 text-primary-700 hover:bg-primary-100 rounded font-medium">Today</button>
          <button onClick={goToNextMonth} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="w-3.5 h-3.5" /></button>
          <button onClick={() => {
            delete cache.current[`${currentYear}-${currentMonth}`];
            fetchMonth(currentYear, currentMonth);
          }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentYear}-${currentMonth}`}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.08 }}
            className="h-full"
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                    <div key={d} className={`text-center text-[8px] font-bold uppercase py-0.5 ${idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-500'}`}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-6 gap-0.5 h-[calc(100%-20px)]">
                  {days.map((day, index) => {
                    if (day === null) return <div key={`empty-${index}`} />;
                    const dateKey = formatDateKey(currentYear, currentMonth, day);
                    const dayHolidays = groupedHolidays[dateKey] || [];
                    return (
                      <DayCell
                        key={day}
                        day={day}
                        dateKey={dateKey}
                        isToday={isToday(day)}
                        isSelected={selectedDate === dateKey}
                        hasHoliday={dayHolidays.length > 0}
                        onClick={() => handleDayClick(day)}
                        onHover={(e) => handleDayMouseEnter(day, e)}
                        onLeave={handleDayMouseLeave}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 pt-1.5 border-t border-gray-200 flex flex-wrap items-center gap-1.5 text-[8px] flex-shrink-0">
        <span className="font-medium text-gray-700 mr-0.5">Events:</span>
        {legendItems.map((item) => (
          <span key={item.type} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${item.color} border border-opacity-20`}>
            {item.icon} {item.label}
          </span>
        ))}
        <span className="ml-auto text-gray-400 text-[7px]">Hover for details</span>
      </div>

      {hoveredDate && hoveredHolidays.length > 0 && (
        <div className="absolute z-50" style={{ top: hoverPosition.top, left: hoverPosition.left, transform: 'translateX(-50%)' }}>
          <HolidayPopover holidays={hoveredHolidays} onClose={() => setHoveredDate(null)} />
        </div>
      )}
    </div>
  );

  const selectedDatePanel = (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className="w-1 h-4 bg-primary-500 rounded-full" />
        <h3 className="text-sm font-semibold text-gray-700 truncate">
          {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          }) : 'Select a Date'}
        </h3>
        {selectedDate && (
          <button onClick={() => { setSelectedDate(null); setHolidaysForSelectedDate([]); }} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {selectedDate && holidaysForSelectedDate.length === 0 && (
          <div className="text-gray-400 text-sm flex flex-col items-center justify-center h-full">
            <CalendarIcon className="w-8 h-8 mb-2 opacity-30" />
            <p>No holidays on this date</p>
            <p className="text-xs mt-1">Click a day with a dot</p>
          </div>
        )}
        {selectedDate && holidaysForSelectedDate.length > 0 && (
          <ul className="space-y-2 pr-1">
            {holidaysForSelectedDate.map((h) => {
              const iconMap = { national: Flag, religious: Church, company: Gift, regional: MapPin };
              const Icon = iconMap[h.type] || Star;
              return (
                <li key={h.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-0.5 text-xs text-gray-600">
                        <span className="bg-gray-200 px-1.5 py-0.5 rounded">{h.type}</span>
                        {h.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {h.location}</span>}
                        {h.employee_count > 0 && <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {h.employee_count}</span>}
                      </div>
                      {h.description && <p className="text-xs text-gray-500 mt-1 italic">{h.description}</p>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {!selectedDate && (
          <div className="text-gray-400 text-sm flex flex-col items-center justify-center h-full">
            <CalendarIcon className="w-8 h-8 mb-2 opacity-30" />
            <p>Click a day to see details</p>
          </div>
        )}
      </div>
    </div>
  );

   const remindersPanel = (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className="w-1 h-4 bg-accent-500 rounded-full" />
        <h3 className="text-sm font-semibold text-gray-700">Upcoming (7 days)</h3>
        <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{upcomingHolidays.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {upcomingHolidays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {upcomingHolidays.map((h) => {
              const iconMap = { national: Flag, religious: Church, company: Gift, regional: MapPin };
              const Icon = iconMap[h.type] || Star;
              const dateObj = new Date(h.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleString('default', { month: 'short' });
              const dayName = dateObj.toLocaleString('default', { weekday: 'short' });
              return (
                <motion.div key={h.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="group flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                  onClick={() => {
                    const dateObj2 = new Date(h.date);
                    const dateKey = `${dateObj2.getFullYear()}-${String(dateObj2.getMonth()+1).padStart(2,'0')}-${String(dateObj2.getDate()).padStart(2,'0')}`;
                    setSelectedDate(dateKey);
                    setHolidaysForSelectedDate([h]);
                    if (onHolidayClick) onHolidayClick([h]);
                  }}>
                  <div className="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-lg flex flex-col items-center justify-center text-primary-700 font-medium">
                    <span className="text-[10px] leading-none uppercase">{month}</span>
                    <span className="text-base font-bold leading-none">{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-primary-600 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">{h.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{h.type}</span>
                      <span className="text-gray-400">•</span>
                      <span>{dayName}</span>
                      {h.location && <><span className="text-gray-400">•</span><span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {h.location}</span></>}
                      {h.employee_count > 0 && <><span className="text-gray-400">•</span><span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {h.employee_count}</span></>}
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-[calc(78vh-100px)] gap-4">
      <div className="lg:col-span-1 h-full">{calendarContent}</div>
      {showDateDetails && <div className="lg:col-span-1 h-full">{selectedDatePanel}</div>}
      {showReminders && <div className="lg:col-span-1 h-full">{remindersPanel}</div>}
    </div>
  );
};

export default HolidayCalendar;
