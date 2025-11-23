import { useState } from 'react';
import { ReactReader } from 'react-reader';

export default function EpubReader({ url }) {
  const [location, setLocation] = useState(null);

  return (
    <div className="h-full">
      <ReactReader
        url={url}
        location={location}
        locationChanged={(epubcfi) => setLocation(epubcfi)}
        getRendition={(rendition) => {
          // Optional: Customize rendition
          // rendition.themes.default({ body: { 'font-family': 'Georgia, serif' } });
        }}
      />
    </div>
  );
}
