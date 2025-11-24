import { useState, useEffect } from 'react';
import { ReactReader } from 'react-reader';

export default function EpubReader({ url }) {
  const [location, setLocation] = useState(null);

  // Fix iframe sandbox restrictions
  useEffect(() => {
    const fixIframeSandbox = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        if (iframe.getAttribute('sandbox')) {
          iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
        }
      });
    };

    // Run immediately and after a short delay to catch dynamically created iframes
    fixIframeSandbox();
    const timer = setTimeout(fixIframeSandbox, 100);

    return () => clearTimeout(timer);
  }, [url]);

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
