// Shared with AddItem.jsx and EditItem.jsx - previously duplicated
// byte-for-byte in both files, which is exactly how they'd silently
// drift apart (new language/genre added to one form but not the other).
export const LANGUAGE_TAGS = ['English', 'Dutch', 'French', 'German', 'Spanish', 'Italian', 'Japanese'];

export const GENRE_TAGS = [
  'Fiction', 'Non-Fiction', 'Biography', 'Science Fiction', 'Fantasy',
  'Mystery', 'Horror', 'Romance', 'Thriller', 'Comedy', 'Drama', 'Action',
];

export const CREATOR_ROLES = [
  { value: 'author', label: 'Author' },
  { value: 'writer', label: 'Writer' },
  { value: 'illustrator', label: 'Illustrator' },
  { value: 'artist', label: 'Artist' },
  { value: 'singer', label: 'Singer' },
  { value: 'songwriter', label: 'Songwriter' },
  { value: 'composer', label: 'Composer' },
  { value: 'director', label: 'Director' },
  { value: 'actor', label: 'Actor' },
  { value: 'band', label: 'Band' },
  { value: 'other', label: 'Other' },
];
