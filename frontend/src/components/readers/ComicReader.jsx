import { useState, useEffect } from 'react';
import ImageGallery from 'react-image-gallery';
import axios from 'axios';
import { FiAlertCircle } from 'react-icons/fi';
import 'react-image-gallery/styles/css/image-gallery.css';

export default function ComicReader({ url }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract images from comic archive
    const fetchComicImages = async () => {
      try {
        // Extract filename from URL
        const filename = url.split('/').pop();
        
        // Call backend API to extract images from CBZ/CBR
        const apiUrl = url.replace(/\/uploads\/ebooks\/.*$/, '');
        const response = await axios.get(`${apiUrl}/api/files/${filename}/images`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        const imageList = response.data.images.map((imgPath, index) => ({
          original: `${apiUrl}${imgPath}`,
          thumbnail: `${apiUrl}${imgPath}`,
          description: `Page ${index + 1}`,
        }));

        setImages(imageList);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load comic images:', err);
        setError('Failed to load comic pages. The file may be corrupted.');
        setLoading(false);
      }
    };

    fetchComicImages();
  }, [url]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading comic pages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Comic</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <ImageGallery
          items={images}
          showPlayButton={false}
          showFullscreenButton={true}
          showNav={true}
          showThumbnails={true}
          thumbnailPosition="bottom"
          slideInterval={0}
          infinite={false}
        />
      </div>
    </div>
  );
}
