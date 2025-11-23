import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useItemStore } from '../store/itemStore';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiAlertCircle, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import EpubReader from '../components/readers/EpubReader';
import PdfReader from '../components/readers/PdfReader';
import ComicReader from '../components/readers/ComicReader';
import { API_URL } from '../services/api';

export default function Reader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const getItemById = useItemStore((state) => state.getItemById);
  const fetchItems = useItemStore((state) => state.fetchItems);
  const [item, setItem] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowHeader(false);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      setShowHeader(true);
    }
  };

  // Listen for fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowHeader(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    fetchItems().then(() => {
      const foundItem = getItemById(id);
      if (foundItem) {
        setItem(foundItem);
        
        // Check if item has a file
        if (!foundItem.file_path) {
          toast.error('No ebook file attached to this item');
          navigate(`/items/${id}`);
          return;
        }

        // Detect file type from extension
        const ext = foundItem.file_path.toLowerCase().split('.').pop();
        
        if (ext === 'epub') {
          setFileType('epub');
        } else if (ext === 'pdf') {
          setFileType('pdf');
        } else if (['cbz', 'cbr'].includes(ext)) {
          setFileType('comic');
        } else {
          toast.error(`Unsupported file format: .${ext}`);
          navigate(`/items/${id}`);
          return;
        }
        
        setLoading(false);
      } else {
        toast.error('Item not found');
        navigate('/items');
      }
    });
  }, [id, fetchItems, getItemById, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading reader...</p>
        </div>
      </div>
    );
  }

  if (!item || !fileType) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Unable to load reader
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This item doesn't have a readable file attached.
          </p>
          <Link to={`/items/${id}`} className="btn btn-primary">
            <FiArrowLeft className="inline mr-2" />
            Back to Item
          </Link>
        </div>
      </div>
    );
  }

  const fileUrl = `${API_URL}${item.file_path}`;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header - Collapsible */}
      {showHeader && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 flex-shrink-0">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Link
                to={`/items/${id}`}
                className="btn btn-secondary flex items-center gap-2 flex-shrink-0"
              >
                <FiArrowLeft />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.creators?.map(c => c.name).join(', ') || item.authors?.join(', ') || 'Unknown Author'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowHeader(false)}
                className="btn btn-secondary flex items-center gap-2"
                title="Hide header (hover top to show again)"
              >
                <FiMinimize2 />
                <span className="hidden sm:inline">Hide</span>
              </button>
              <button
                onClick={toggleFullscreen}
                className="btn btn-primary flex items-center gap-2"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover area to show header when hidden */}
      {!showHeader && (
        <div
          className="absolute top-0 left-0 right-0 h-4 z-40"
          onMouseEnter={() => setShowHeader(true)}
          title="Hover to show header"
        />
      )}

      {/* Reader Content */}
      <div className="flex-1 min-h-0">
        {fileType === 'epub' && <EpubReader url={fileUrl} />}
        {fileType === 'pdf' && <PdfReader url={fileUrl} />}
        {fileType === 'comic' && <ComicReader url={fileUrl} />}
      </div>
    </div>
  );
}
