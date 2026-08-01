import { FiBook, FiDisc, FiFilm, FiFileText, FiPackage } from 'react-icons/fi';

// A single source of truth for per-media-type color/icon/label, so every
// page (Dashboard, Wishlist, ItemList, Statistics, ReadingStats) draws from
// one deliberate palette instead of each picking its own ad-hoc Tailwind
// hues. Book/Ebook anchor to the app's actual primary (sky) token since
// books are the flagship format; the rest is a small, curated accent set -
// deliberately avoiding purple, the most common "AI-generated UI" tell.
export const MEDIA_TYPES = {
  book: {
    label: 'Books', icon: FiBook,
    solid: 'bg-primary-600', text: 'text-primary-700 dark:text-primary-400',
    chip: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
    chart: '#0284c7',
  },
  comic: {
    label: 'Comics', icon: FiBook,
    solid: 'bg-teal-600', text: 'text-teal-700 dark:text-teal-400',
    chip: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
    chart: '#0d9488',
  },
  cd: {
    label: 'CDs', icon: FiDisc,
    solid: 'bg-amber-600', text: 'text-amber-700 dark:text-amber-400',
    chip: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    chart: '#d97706',
  },
  vinyl: {
    label: 'Vinyl', icon: FiDisc,
    solid: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-400',
    chip: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    chart: '#e11d48',
  },
  dvd: {
    label: 'DVDs', icon: FiFilm,
    solid: 'bg-red-600', text: 'text-red-700 dark:text-red-400',
    chip: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    chart: '#dc2626',
  },
  bluray: {
    label: 'Blu-rays', icon: FiFilm,
    solid: 'bg-indigo-600', text: 'text-indigo-700 dark:text-indigo-400',
    chip: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
    chart: '#4f46e5',
  },
  ebook: {
    label: 'Ebooks', icon: FiFileText,
    solid: 'bg-sky-600', text: 'text-sky-700 dark:text-sky-400',
    chip: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
    chart: '#0ea5e9',
  },
  other: {
    label: 'Other', icon: FiPackage,
    solid: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-400',
    chip: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    chart: '#64748b',
  },
};

export const MEDIA_TYPE_ORDER = ['book', 'comic', 'cd', 'vinyl', 'dvd', 'bluray', 'ebook', 'other'];

export function getMediaTypeMeta(type) {
  return MEDIA_TYPES[type] || MEDIA_TYPES.other;
}
