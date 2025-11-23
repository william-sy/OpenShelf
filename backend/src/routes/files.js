import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { Item } from '../models/Item.js';
import EPub from 'epub';
import pdfParse from 'pdf-parse';
import JSZip from 'jszip';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/ebooks');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: itemId_timestamp_originalname
    const itemId = req.params.id || 'new';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    // Sanitize filename
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `item_${itemId}_${timestamp}_${sanitizedBasename}${ext}`);
  }
});

// File filter - only allow specific ebook formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/epub+zip',
    'application/pdf',
    'application/x-cbz',
    'application/x-cbr',
    'application/zip',
    'application/x-rar-compressed'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.epub', '.pdf', '.cbz', '.cbr', '.zip', '.rar'];
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// Extract metadata from EPUB file
async function extractEpubMetadata(filePath) {
  return new Promise((resolve) => {
    try {
      const epub = new EPub(filePath);
      
      epub.on('end', () => {
        resolve({
          title: epub.metadata?.title || null,
          author: epub.metadata?.creator || epub.metadata?.author || null,
          publisher: epub.metadata?.publisher || null,
          description: epub.metadata?.description || null,
          language: epub.metadata?.language || null,
          publishDate: epub.metadata?.date || null,
          isbn: epub.metadata?.ISBN || null,
          pageCount: epub.flow?.length || null,
          format: 'EPUB'
        });
      });
      
      epub.on('error', (error) => {
        console.error('EPUB metadata extraction failed:', error);
        resolve({ format: 'EPUB', error: error.message });
      });
      
      epub.parse();
    } catch (error) {
      console.error('EPUB metadata extraction failed:', error);
      resolve({ format: 'EPUB', error: error.message });
    }
  });
}

// Extract metadata from PDF file
async function extractPdfMetadata(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    
    return {
      title: pdfData.info?.Title || null,
      author: pdfData.info?.Author || null,
      creator: pdfData.info?.Creator || null,
      producer: pdfData.info?.Producer || null,
      publishDate: pdfData.info?.CreationDate || null,
      pageCount: pdfData.numpages || null,
      format: 'PDF',
      text: pdfData.text ? pdfData.text.substring(0, 500) : null // First 500 chars for description
    };
  } catch (error) {
    console.error('PDF metadata extraction failed:', error);
    return { format: 'PDF', error: error.message };
  }
}

// Extract metadata from CBZ/CBR (comic book archives)
async function extractComicMetadata(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Get list of image files
    const imageFiles = Object.keys(zip.files).filter(filename => {
      const ext = path.extname(filename).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).sort();
    
    return {
      format: path.extname(filePath).toUpperCase().replace('.', ''),
      pageCount: imageFiles.length,
      images: imageFiles,
      coverImage: imageFiles[0] || null
    };
  } catch (error) {
    console.error('Comic metadata extraction failed:', error);
    return { 
      format: path.extname(filePath).toUpperCase().replace('.', ''),
      error: error.message 
    };
  }
}

// Extract cover image from EPUB
async function extractEpubCover(filePath) {
  return new Promise((resolve) => {
    try {
      const epub = new EPub(filePath);
      
      epub.on('end', async () => {
        try {
          const coverId = epub.metadata?.cover;
          
          if (coverId) {
            // Get the cover image
            epub.getImage(coverId, async (error, img, mimeType) => {
              if (error || !img) {
                console.error('Failed to get EPUB cover:', error);
                resolve(null);
                return;
              }
              
              try {
                // Optimize the cover image
                const optimizedBuffer = await sharp(img)
                  .resize(500, 700, { fit: 'inside', withoutEnlargement: true })
                  .jpeg({ quality: 85 })
                  .toBuffer();
                
                resolve(optimizedBuffer);
              } catch (sharpError) {
                console.error('Failed to optimize EPUB cover:', sharpError);
                resolve(null);
              }
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('EPUB cover extraction failed:', error);
          resolve(null);
        }
      });
      
      epub.on('error', (error) => {
        console.error('EPUB cover extraction failed:', error);
        resolve(null);
      });
      
      epub.parse();
    } catch (error) {
      console.error('EPUB cover extraction failed:', error);
      resolve(null);
    }
  });
}

// Extract cover image from comic archive (first image)
async function extractComicCover(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Get list of image files sorted
    const imageFiles = Object.keys(zip.files)
      .filter(filename => {
        const ext = path.extname(filename).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
      })
      .sort();
    
    if (imageFiles.length === 0) {
      return null;
    }
    
    // Extract first image
    const firstImage = await zip.files[imageFiles[0]].async('nodebuffer');
    
    // Optimize with sharp
    const optimizedBuffer = await sharp(firstImage)
      .resize(500, 700, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    return optimizedBuffer;
  } catch (error) {
    console.error('Comic cover extraction failed:', error);
    return null;
  }
}

// Save cover image to uploads directory
async function saveCoverImage(coverBuffer, originalFilename) {
  try {
    const coversDir = path.join(__dirname, '../../uploads/covers');
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const basename = path.basename(originalFilename, path.extname(originalFilename));
    const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const coverFilename = `cover_${sanitizedBasename}_${timestamp}.jpg`;
    const coverPath = path.join(coversDir, coverFilename);
    
    await fs.promises.writeFile(coverPath, coverBuffer);
    
    // Return path with /api/ prefix so frontend treats it as an extracted cover
    return `/api/files/covers/${coverFilename}`;
  } catch (error) {
    console.error('Error saving cover image:', error);
    return null;
  }
}

// Serve extracted cover images (no auth required for serving images)
router.get('/covers/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const coverPath = path.join(__dirname, '../../uploads/covers', filename);
    
    if (!fs.existsSync(coverPath)) {
      return res.status(404).json({ error: 'Cover image not found' });
    }
    
    res.sendFile(coverPath);
  } catch (error) {
    console.error('Error serving cover image:', error);
    res.status(500).json({ error: 'Failed to serve cover image' });
  }
});

// Extract and serve images from comic archives (CBZ/CBR)
router.get('/:filename/images', authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/ebooks', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Comic file not found' });
    }

    // Read and extract images from archive
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    
    // Get all image files sorted
    const imageFiles = Object.keys(zip.files)
      .filter(filename => {
        const ext = path.extname(filename).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext);
      })
      .sort();
    
    // Create a temporary directory for extracted images
    const tempDir = path.join(__dirname, '../../uploads/temp', `comic_${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Extract and save images
    const imageUrls = [];
    for (const imageName of imageFiles) {
      const imageData = await zip.files[imageName].async('nodebuffer');
      const safeName = imageName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const imagePath = path.join(tempDir, safeName);
      await fs.promises.writeFile(imagePath, imageData);
      imageUrls.push(`/api/files/temp/${path.basename(tempDir)}/${safeName}`);
    }
    
    res.json({
      success: true,
      images: imageUrls,
      pageCount: imageFiles.length
    });
  } catch (error) {
    console.error('Error extracting comic images:', error);
    res.status(500).json({ error: 'Failed to extract comic images', details: error.message });
  }
});

// Serve temporary comic page images
router.get('/temp/:sessionId/:filename', (req, res) => {
  try {
    const { sessionId, filename } = req.params;
    const imagePath = path.join(__dirname, '../../uploads/temp', sessionId, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving comic page:', error);
    res.status(500).json({ error: 'Failed to serve comic page' });
  }
});

// All other routes require authentication
router.use(authenticateToken);

// Upload ebook file without item (for use during item creation)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract metadata based on file type
    const ext = path.extname(req.file.filename).toLowerCase();
    let metadata = {};
    let coverImageUrl = null;
    
    try {
      if (ext === '.epub') {
        metadata = await extractEpubMetadata(req.file.path);
        // Extract cover image from EPUB
        const coverBuffer = await extractEpubCover(req.file.path);
        if (coverBuffer) {
          coverImageUrl = await saveCoverImage(coverBuffer, req.file.originalname);
        }
      } else if (ext === '.pdf') {
        metadata = await extractPdfMetadata(req.file.path);
        // Note: PDF cover extraction requires canvas/native dependencies
        // Skipping for Docker compatibility - users can upload cover manually
      } else if (['.cbz', '.cbr', '.zip', '.rar'].includes(ext)) {
        metadata = await extractComicMetadata(req.file.path);
        // Extract first image as cover from comic archive
        const coverBuffer = await extractComicCover(req.file.path);
        if (coverBuffer) {
          coverImageUrl = await saveCoverImage(coverBuffer, req.file.originalname);
        }
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      // Continue even if metadata extraction fails
    }

    // Store relative path from backend root
    const relativePath = `/uploads/ebooks/${req.file.filename}`;

    res.json({
      success: true,
      file_path: relativePath,
      original_name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      metadata: metadata,
      cover_url: coverImageUrl // Include extracted cover image URL
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload file', details: error.message });
  }
});

// Upload ebook file for an item
router.post('/:id/upload-file', upload.single('file'), async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify item exists and belongs to user
    const item = Item.findById(itemId);
    if (!item) {
      // Delete uploaded file if item doesn't exist
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.user_id !== userId) {
      // Delete uploaded file if user doesn't own item
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Delete old file if it exists
    if (item.file_path && fs.existsSync(path.join(__dirname, '../../', item.file_path))) {
      fs.unlinkSync(path.join(__dirname, '../../', item.file_path));
    }
    
    // Store relative path from backend root
    const relativePath = `/uploads/ebooks/${req.file.filename}`;
    
    // Extract metadata based on file type
    const ext = path.extname(req.file.filename).toLowerCase();
    let metadata = {};
    
    if (ext === '.epub') {
      metadata = await extractEpubMetadata(req.file.path);
    } else if (ext === '.pdf') {
      metadata = await extractPdfMetadata(req.file.path);
    } else if (['.cbz', '.cbr', '.zip', '.rar'].includes(ext)) {
      metadata = await extractComicMetadata(req.file.path);
    }
    
    // Update item with file path and extracted metadata
    const updateData = {
      file_path: relativePath
    };
    
    // Optionally update item fields from extracted metadata
    const autoFillMetadata = req.body.autoFill === 'true';
    if (autoFillMetadata && metadata) {
      if (metadata.title && !item.title) updateData.title = metadata.title;
      if (metadata.author && !item.creators?.length) {
        updateData.creators = [{ name: metadata.author, role: 'author' }];
      }
      if (metadata.publisher && !item.publisher) updateData.publisher = metadata.publisher;
      if (metadata.description && !item.description) updateData.description = metadata.description;
      if (metadata.language && !item.language) updateData.language = metadata.language;
      if (metadata.publishDate && !item.publish_date) updateData.publish_date = metadata.publishDate;
      if (metadata.isbn && !item.isbn) updateData.isbn = metadata.isbn;
      if (metadata.pageCount && !item.page_count) updateData.page_count = metadata.pageCount;
    }
    
    Item.update(itemId, updateData);
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: relativePath
      },
      metadata: metadata
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'File upload failed', message: error.message });
  }
});

// Download/stream ebook file
router.get('/:id/file', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify item exists and belongs to user
    const item = Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!item.file_path) {
      return res.status(404).json({ error: 'No file attached to this item' });
    }
    
    const filePath = path.join(__dirname, '../../', item.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.title || filename)}${path.extname(filename)}"`);
    res.setHeader('Content-Length', stats.size);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed', message: error.message });
  }
});

// Delete ebook file
router.delete('/:id/file', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify item exists and belongs to user
    const item = Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!item.file_path) {
      return res.status(404).json({ error: 'No file attached to this item' });
    }
    
    const filePath = path.join(__dirname, '../../', item.file_path);
    
    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Update item to remove file path
    Item.update(itemId, { file_path: null });
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({ error: 'File deletion failed', message: error.message });
  }
});

// Get file info without downloading
router.get('/:id/file-info', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.user.id;
    
    // Verify item exists and belongs to user
    const item = Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (item.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!item.file_path) {
      return res.status(404).json({ error: 'No file attached to this item' });
    }
    
    const filePath = path.join(__dirname, '../../', item.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    res.json({
      filename: path.basename(filePath),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      format: ext.replace('.', '').toUpperCase(),
      uploadedAt: stats.birthtime,
      modifiedAt: stats.mtime
    });
    
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file info', message: error.message });
  }
});

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default router;
