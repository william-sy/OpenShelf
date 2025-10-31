import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { FiX, FiCamera, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ISBNScanner({ onScan, onClose }) {
  const [scanning, setScanning] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(''); // Live feedback text
  const [scanCount, setScanCount] = useState(0); // Count of scan attempts
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('scanner');
      html5QrCodeRef.current = html5QrCode;

      // Use rear camera preference (works on both mobile and desktop)
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 }, // Wider box for barcode shape
          aspectRatio: 2.0, // Barcodes are wider than tall
          // Enable multiple barcode formats for ISBN scanning
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          // Advanced camera controls (may not work on all browsers)
          advanced: [
            { zoom: 2.0 },
            { focusMode: 'continuous' },
          ],
        },
        (decodedText) => {
          // Provide live feedback
          setScanCount(prev => prev + 1);
          
          // Prevent duplicate scans - stop immediately on first valid scan
          if (isProcessing) {
            console.log('Already processing, ignoring scan');
            return;
          }
          
          console.log('Scanned:', decodedText); // Debug
          // Check if it's a valid ISBN (10 or 13 digits)
          const isbn = decodedText.replace(/[-\s]/g, '');
          console.log('Cleaned ISBN:', isbn); // Debug
          
          if (/^\d{10}(\d{3})?$/.test(isbn)) {
            // CRITICAL: Set processing flag FIRST to block all future scans
            setIsProcessing(true);
            setScanFeedback('✅ ISBN Found!');
            
            // Stop the scanner IMMEDIATELY
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.stop()
                .then(() => {
                  console.log('Scanner stopped successfully');
                  setScanning(false);
                })
                .catch(err => {
                  console.error('Error stopping scanner:', err);
                  setScanning(false);
                });
            }
            
            toast.success(`ISBN detected: ${isbn}`, { duration: 2000 });
            
            // Call onScan with the ISBN
            onScan(isbn);
            
            // Close modal after short delay
            setTimeout(() => {
              onClose();
            }, 500);
          } else {
            // Show what was scanned for feedback
            if (decodedText.length > 5) {
              setScanFeedback(`📷 Scanned: ${decodedText.substring(0, 15)}... (not ISBN)`);
            }
          }
        },
        (errorMessage) => {
          // Update feedback to show scanning is active
          if (scanCount === 0) {
            setScanFeedback('🔍 Scanning... Point camera at barcode');
          }
        }
      );

      setScanning(true);
      setScanFeedback('🔍 Scanning... Point camera at barcode');
      toast.success('Scanner started - hold barcode steady');
    } catch (error) {
      console.error('Camera error:', error);
      setPermissionDenied(true);
      
      // Show helpful message based on error
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please use the file upload option below.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No camera found. Please use the file upload option below.');
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera is in use by another app. Please use the file upload option.');
      } else {
        toast.error('Cannot access camera (HTTPS required). Please use file upload instead.');
      }
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current && scanning) {
      html5QrCodeRef.current
        .stop()
        .then(() => {
          setScanning(false);
        })
        .catch((err) => {
          console.error('Error stopping scanner:', err);
        });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || isProcessing) return;

    setIsProcessing(true);
    toast.loading('Processing image...', { id: 'file-scan' });
    
    try {
      // Stop the active scanner first if it's running
      if (html5QrCodeRef.current && scanning) {
        try {
          await html5QrCodeRef.current.stop();
          setScanning(false);
        } catch (err) {
          console.log('Scanner already stopped');
        }
      }

      // Create a temporary div for file scanning if scanner div doesn't exist
      let scannerId = 'scanner';
      let tempDiv = null;
      if (!document.getElementById('scanner')) {
        tempDiv = document.createElement('div');
        tempDiv.id = 'file-scanner-temp';
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        scannerId = 'file-scanner-temp';
      }

      // Create a new scanner instance for file scanning
      const html5QrCode = new Html5Qrcode(scannerId);
      const result = await html5QrCode.scanFile(file, true);
      
      // Cleanup temp div
      if (tempDiv) {
        document.body.removeChild(tempDiv);
      }
      
      toast.dismiss('file-scan');
      
      // Check if it's a valid ISBN
      const isbn = result.replace(/[-\s]/g, '');
      if (/^\d{10}(\d{3})?$/.test(isbn)) {
        toast.success(`ISBN detected: ${isbn}`);
        onScan(isbn);
        setTimeout(() => onClose(), 500);
      } else {
        toast.error('Invalid ISBN format in image');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('File scan error:', error);
      toast.dismiss('file-scan');
      
      // Provide specific error messages
      if (error.message && error.message.includes('No MultiFormat Readers')) {
        toast.error('Could not detect a barcode in the image. Try:\n• Better lighting\n• Hold camera closer\n• Ensure barcode is in focus\n• Take photo straight-on, not at an angle', {
          duration: 5000,
        });
      } else {
        toast.error('Could not read barcode from image. Please try another photo or ensure the barcode is clear and well-lit.');
      }
      
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FiCamera className="w-6 h-6" />
            Scan ISBN Barcode
          </h3>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {!permissionDenied ? (
            <>
              <div className="relative">
                <div
                  id="scanner"
                  ref={scannerRef}
                  className="w-full aspect-square bg-gray-900 rounded-lg overflow-hidden"
                />
                
                {/* Live Feedback Overlay */}
                {scanning && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="text-center">
                      <p className="text-white font-medium text-lg flex items-center justify-center gap-2">
                        {isProcessing ? (
                          <>✅ ISBN Found!</>
                        ) : (
                          <>
                            <span className="animate-pulse">📷</span>
                            {scanFeedback || '🔍 Searching for barcode...'}
                          </>
                        )}
                      </p>
                      {scanCount > 0 && !isProcessing && (
                        <p className="text-white/70 text-sm mt-1">
                          {scanCount === 1 ? '1 scan attempt' : `${scanCount} scan attempts`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">
                  📱 Tips for scanning ISBN barcodes:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Hold the book steady, about 6-8 inches from camera</li>
                  <li>Ensure good lighting on the barcode</li>
                  <li>Keep the barcode horizontal in the frame</li>
                  <li>Wait a few seconds for detection</li>
                  <li>If it doesn't work, try the file upload below</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                ⚠️ Camera access is not available. This typically happens when accessing via IP address without HTTPS.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                Please upload a photo of the barcode instead:
              </p>
              <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside mt-2">
                <li>Take photo straight-on (not at an angle)</li>
                <li>Get close - barcode should fill most of frame</li>
                <li>Use good lighting (natural light works best)</li>
                <li>Make sure barcode is sharp and in focus</li>
                <li>Avoid shadows or glare on the barcode</li>
              </ul>
            </div>
          )}

          {/* File upload option */}
          <div className="space-y-2">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn btn-secondary flex items-center justify-center gap-2"
              >
                <FiUpload className="w-5 h-5" />
                {permissionDenied ? 'Upload Barcode Image' : 'Or Upload Image Instead'}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Take a photo of the barcode or select from gallery
            </p>
          </div>

          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="w-full btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
