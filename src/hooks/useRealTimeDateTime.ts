import { useState, useEffect } from 'react';
import { getSystemTimezoneLabel, getRealTodayIso } from '../utils/formatters';

export interface RealTimeDateTimeState {
  now: Date;
  dateIso: string;
  dayName: string;
  dayOfMonth: number;
  monthName: string;
  monthShort: string;
  year: number;
  dateFormatted: string; // e.g., "Jumat, 25 Sep 2026"
  dateFullFormatted: string; // e.g., "Jumat, 25 September 2026"
  timeFormatted: string; // e.g., "19:05:42" or "07:05:42 PM"
  timeShortFormatted: string; // e.g., "19:05"
  hours: string;
  minutes: string;
  seconds: string;
  period: string; // AM/PM if 12h
  timezone: string; // WIB, WITA, WIT, etc.
  timezoneOffsetStr: string; // e.g., "UTC+7"
  greeting: string; // "Selamat Pagi", etc.
  isEvenSecond: boolean;
}

export function useRealTimeDateTime(options?: {
  use12Hour?: boolean;
  showSeconds?: boolean;
}): RealTimeDateTimeState {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    // Update every second with high accuracy
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const d = currentDate;
  const is12Hour = Boolean(options?.use12Hour);

  // Timezone calculation
  const timezone = getSystemTimezoneLabel();
  const offsetMin = -d.getTimezoneOffset();
  const offsetHours = offsetMin / 60;
  const timezoneOffsetStr = `UTC${offsetHours >= 0 ? '+' : ''}${offsetHours}`;

  // Time formatting
  const rawHours = d.getHours();
  const minutesNum = d.getMinutes();
  const secondsNum = d.getSeconds();

  const hours = is12Hour
    ? String(rawHours % 12 || 12).padStart(2, '0')
    : String(rawHours).padStart(2, '0');
  const minutes = String(minutesNum).padStart(2, '0');
  const seconds = String(secondsNum).padStart(2, '0');
  const period = rawHours >= 12 ? 'PM' : 'AM';

  const timeFormatted = is12Hour
    ? `${hours}:${minutes}:${seconds} ${period}`
    : `${hours}:${minutes}:${seconds}`;

  const timeShortFormatted = is12Hour
    ? `${hours}:${minutes} ${period}`
    : `${hours}:${minutes}`;

  // Date formatting (Indonesian locale)
  const dayName = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const monthName = d.toLocaleDateString('id-ID', { month: 'long' });
  const monthShort = d.toLocaleDateString('id-ID', { month: 'short' });
  const dayOfMonth = d.getDate();
  const year = d.getFullYear();

  const dateFormatted = `${dayName}, ${dayOfMonth} ${monthShort} ${year}`;
  const dateFullFormatted = `${dayName}, ${dayOfMonth} ${monthName} ${year}`;
  const dateIso = getRealTodayIso();

  // Time of day greeting
  let greeting = 'Selamat Pagi';
  if (rawHours >= 11 && rawHours < 15) {
    greeting = 'Selamat Siang';
  } else if (rawHours >= 15 && rawHours < 18) {
    greeting = 'Selamat Sore';
  } else if (rawHours >= 18 || rawHours < 4) {
    greeting = 'Selamat Malam';
  }

  return {
    now: d,
    dateIso,
    dayName,
    dayOfMonth,
    monthName,
    monthShort,
    year,
    dateFormatted,
    dateFullFormatted,
    timeFormatted,
    timeShortFormatted,
    hours,
    minutes,
    seconds,
    period,
    timezone,
    timezoneOffsetStr,
    greeting,
    isEvenSecond: secondsNum % 2 === 0
  };
}
