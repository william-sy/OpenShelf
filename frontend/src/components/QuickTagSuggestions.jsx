import { useState } from 'react';
import toast from 'react-hot-toast';
import { LANGUAGE_TAGS, GENRE_TAGS } from '../utils/tagSuggestions';

const VISIBLE_COUNT = 5;

function TagGroup({ label, options, tags, onAdd, activeClass, idleClass }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, VISIBLE_COUNT);
  const hiddenCount = options.length - VISIBLE_COUNT;

  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        {visible.map((option) => {
          const active = tags.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onAdd(option)}
              disabled={active}
              className={`px-2 py-1 text-xs rounded-full transition-colors ${
                active ? `${activeClass} cursor-not-allowed` : idleClass
              }`}
            >
              {option} {active ? '✓' : null}
            </button>
          );
        })}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-2 py-1 text-xs rounded-full text-primary-600 dark:text-primary-400 hover:underline"
          >
            {expanded ? 'Show less' : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}

// Caps suggestions to 5 visible per group by default (behind a "show more"
// toggle) instead of a flat wall of ~19 buttons all shown at once.
export default function QuickTagSuggestions({ tags = [], onChange }) {
  const addTag = (value) => {
    if (!tags.includes(value)) {
      onChange([...tags, value]);
      toast.success(`Added ${value} tag`);
    }
  };

  return (
    <div className="mb-3 space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">Quick Add:</p>
      <TagGroup
        label="Language"
        options={LANGUAGE_TAGS}
        tags={tags}
        onAdd={addTag}
        activeClass="bg-blue-500 text-white"
        idleClass="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900"
      />
      <TagGroup
        label="Genre"
        options={GENRE_TAGS}
        tags={tags}
        onAdd={addTag}
        activeClass="bg-green-500 text-white"
        idleClass="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900"
      />
    </div>
  );
}
