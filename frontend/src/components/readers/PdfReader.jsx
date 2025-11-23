import { Worker } from '@react-pdf-viewer/core';
import { Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

export default function PdfReader({ url }) {
  // Create plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-800">
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
        <Viewer
          fileUrl={url}
          plugins={[defaultLayoutPluginInstance]}
          theme={{
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          }}
        />
      </Worker>
    </div>
  );
}
