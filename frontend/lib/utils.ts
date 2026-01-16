import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHKTime(date: string | Date | number, options: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleTimeString('en-HK', {
    timeZone: 'Asia/Hong_Kong',
    hour12: false, // Standard for transit/schedule data
    hour: '2-digit', 
    minute: '2-digit',
    ...options
  });
}

export function formatHKDateTime(date: string | Date | number, options: Intl.DateTimeFormatOptions = {}): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return d.toLocaleString('en-HK', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      ...options
    });
}
