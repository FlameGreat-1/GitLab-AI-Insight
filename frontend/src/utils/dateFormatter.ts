// src/utils/dateFormatter.ts

import { format, formatDistance, formatRelative, isValid, parseISO } from 'date-fns';
import { enUS, es, fr, de, ja } from 'date-fns/locale';

type SupportedLocale = 'en-US' | 'es' | 'fr' | 'de' | 'ja';

const locales: { [key in SupportedLocale]: Locale } = {
  'en-US': enUS,
  'es': es,
  'fr': fr,
  'de': de,
  'ja': ja,
};

interface DateFormatterOptions {
  locale?: SupportedLocale;
  includeTime?: boolean;
  useRelative?: boolean;
}

class DateFormatter {
  private locale: Locale;

  constructor(localeKey: SupportedLocale = 'en-US') {
    this.locale = locales[localeKey];
  }

  setLocale(localeKey: SupportedLocale): void {
    this.locale = locales[localeKey];
  }

  format(date: Date | string | number, formatString: string = 'PP', options: DateFormatterOptions = {}): string {
    const parsedDate = this.parseDate(date);
    if (!isValid(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    const { includeTime = false, useRelative = false } = options;

    if (useRelative) {
      return formatRelative(parsedDate, new Date(), { locale: this.locale });
    }

    const dateFormatString = includeTime ? `${formatString} p` : formatString;
    return format(parsedDate, dateFormatString, { locale: this.locale });
  }

  formatDistance(date: Date | string | number, baseDate: Date = new Date(), options: DateFormatterOptions = {}): string {
    const parsedDate = this.parseDate(date);
    if (!isValid(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    return formatDistance(parsedDate, baseDate, { 
      locale: this.locale, 
      addSuffix: true,
      ...options 
    });
  }

  formatRelative(date: Date | string | number, baseDate: Date = new Date(), options: DateFormatterOptions = {}): string {
    const parsedDate = this.parseDate(date);
    if (!isValid(parsedDate)) {
      throw new Error('Invalid date provided');
    }

    return formatRelative(parsedDate, baseDate, { 
      locale: this.locale,
      ...options 
    });
  }

  private parseDate(date: Date | string | number): Date {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === 'string') {
      return parseISO(date);
    }
    return new Date(date);
  }

  getMonthName(month: number, options: { long?: boolean } = {}): string {
    const { long = true } = options;
    const date = new Date(2000, month, 1);
    return format(date, long ? 'MMMM' : 'MMM', { locale: this.locale });
  }

  getDayName(day: number, options: { long?: boolean } = {}): string {
    const { long = true } = options;
    const date = new Date(2000, 0, day);
    return format(date, long ? 'EEEE' : 'EEE', { locale: this.locale });
  }

  isWeekend(date: Date | string | number): boolean {
    const parsedDate = this.parseDate(date);
    const dayOfWeek = parsedDate.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  addDays(date: Date | string | number, days: number): Date {
    const parsedDate = this.parseDate(date);
    parsedDate.setDate(parsedDate.getDate() + days);
    return parsedDate;
  }

  subtractDays(date: Date | string | number, days: number): Date {
    return this.addDays(date, -days);
  }
}

export const dateFormatter = new DateFormatter();

export default DateFormatter;
