type DateInput = string | Date;

const toDate = (input: DateInput): Date =>
  input instanceof Date ? input : new Date(input);

interface FormatShortDateOptions {
  includeYear?: boolean;
  useRelative?: boolean;
  locale?: string;
  todayLabel?: string;
  yesterdayLabel?: string;
}

export const formatShortDate = (
  input: DateInput,
  options: FormatShortDateOptions = {}
): string => {
  const date = toDate(input);
  const {
    includeYear = true,
    useRelative = false,
    locale = 'en-US',
    todayLabel = 'Today',
    yesterdayLabel = 'Yesterday',
  } = options;

  if (useRelative) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return todayLabel;
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return yesterdayLabel;
    }
  }

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
};

interface FormatDateTimeOptions {
  locale?: string;
}

export const formatDateTime = (
  input: DateInput,
  options: FormatDateTimeOptions = {}
): string => {
  const date = toDate(input);
  const { locale = 'en-US' } = options;

  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

interface FormatDurationOptions {
  inProgressLabel?: string;
}

export const formatDuration = (
  start: DateInput,
  end?: DateInput,
  options: FormatDurationOptions = {}
): string => {
  if (!end) {
    return options.inProgressLabel ?? 'In progress';
  }

  const startDate = toDate(start);
  const endDate = toDate(end);
  const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};
