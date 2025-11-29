import { QRCodeSVG } from 'qrcode.react';
import { API_URL } from '../services/api';

// Helper to convert relative API URLs to absolute URLs
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${API_URL}${url}`;
  if (url.startsWith('/')) return `${API_URL}${url}`;
  return url;
};

export default function ItemLabel({ item, settings }) {
  // Use provided settings or defaults
  const labelSettings = settings || {
    baseUrl: window.location.origin,
    labelWidth: 210,
    labelHeight: 297,
    orientation: 'portrait',
    qrSize: 180,
    coverSize: 60,
    fontSize: 12,
    imageDpi: 302,
    textAlign: 'left',
    showSpine: false,
    spineWidth: 10,
    mirrorLayout: false,
    showTitle: true,
    showType: true,
    showCreators: true,
    showCover: true,
    showIsbn: false,
    showPublisher: false,
    showYear: false,
    showLocation: false,
    showUrl: true,
  };

  // Determine if we should use landscape layout
  const isLandscape = labelSettings.orientation === 'landscape';
  // Mirror layout flips QR and content positions
  const isMirrored = labelSettings.mirrorLayout;

  const itemUrl = `${labelSettings.baseUrl}/items/${item.id}`;
  const coverImageUrl = getImageUrl(item.cover_url);

  const formatCreators = () => {
    if (!item.creators || item.creators.length === 0) return '';
    return item.creators.map(c => c.name).join(', ');
  };

  // Calculate responsive sizes based on label dimensions
  const isVerySmallLabel = labelSettings.labelHeight < 40;
  const isSmallLabel = labelSettings.labelWidth < 100 || labelSettings.labelHeight < 100;
  const qrSize = labelSettings.qrSize || 180;
  const coverSize = labelSettings.coverSize || 60;
  
  // Use configurable base font size
  const baseFontSize = labelSettings.fontSize || 12;
  
  const padding = isVerySmallLabel ? '2px' : isSmallLabel ? '4px' : '8px';
  const titleSize = isVerySmallLabel ? `${baseFontSize * 0.67}px` : isSmallLabel ? `${baseFontSize * 0.83}px` : `${baseFontSize * 1.17}px`;
  const creatorSize = isVerySmallLabel ? `${baseFontSize * 0.5}px` : isSmallLabel ? `${baseFontSize * 0.67}px` : `${baseFontSize * 0.92}px`;
  const typeSize = isVerySmallLabel ? `${baseFontSize * 0.42}px` : isSmallLabel ? `${baseFontSize * 0.5}px` : `${baseFontSize * 0.75}px`;
  const infoSize = isVerySmallLabel ? `${baseFontSize * 0.5}px` : isSmallLabel ? `${baseFontSize * 0.58}px` : `${baseFontSize * 0.83}px`;
  const urlSize = isVerySmallLabel ? `${baseFontSize * 0.42}px` : isSmallLabel ? `${baseFontSize * 0.5}px` : `${baseFontSize * 0.67}px`;
  const spacing = isVerySmallLabel ? '2px' : isSmallLabel ? '4px' : '6px';

  // QR Code section
  const qrSection = (
    <div style={{
      padding: '4px',
      flexShrink: 0,
    }}>
      <QRCodeSVG
        value={itemUrl}
        size={qrSize}
        level="H"
        includeMargin={false}
      />
    </div>
  );

  // Cover Image section
  const coverSection = labelSettings.showCover && coverImageUrl && (
    <div style={{ flexShrink: 0 }}>
      <img 
        src={coverImageUrl} 
        alt={item.title}
        style={{
          maxHeight: `${coverSize}px`,
          maxWidth: `${coverSize}px`,
          objectFit: 'contain',
          imageRendering: labelSettings.imageDpi > 200 ? 'high-quality' : 'auto',
        }}
        crossOrigin="anonymous"
        onError={(e) => { 
          console.error('Failed to load cover image:', coverImageUrl, 'for item:', item.title);
          e.target.style.display = 'none'; 
        }}
      />
    </div>
  );

  // Spine indicator section - use item's spine_width if available, otherwise use global setting
  const actualSpineWidth = item.spine_width || labelSettings.spineWidth;
  const spineSection = labelSettings.showSpine && actualSpineWidth > 0 && (
    <div style={{
      width: isLandscape ? `${actualSpineWidth}mm` : '100%',
      height: isLandscape ? '100%' : `${actualSpineWidth}mm`,
      backgroundColor: '#ddd',
      borderLeft: isLandscape ? '2px dashed #999' : 'none',
      borderRight: isLandscape ? '2px dashed #999' : 'none',
      borderTop: !isLandscape ? '2px dashed #999' : 'none',
      borderBottom: !isLandscape ? '2px dashed #999' : 'none',
      flexShrink: 0,
    }} />
  );

  // Text/Info section
  const infoSection = (
    <div style={{ 
      width: isLandscape ? 'auto' : '100%',
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
      maxHeight: '100%',
      textAlign: labelSettings.textAlign,
    }}>
        {labelSettings.showTitle && (
          <div style={{
            fontSize: titleSize,
            fontWeight: 'bold',
            color: '#111',
            marginBottom: spacing,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: isSmallLabel ? '2' : '3',
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2',
          }}>
            {item.title}
          </div>
        )}

        {labelSettings.showCreators && formatCreators() && (
          <div style={{
            fontSize: creatorSize,
            color: '#666',
            marginBottom: spacing,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: isSmallLabel ? 'nowrap' : 'normal',
            display: isSmallLabel ? 'block' : '-webkit-box',
            WebkitLineClamp: isSmallLabel ? 'unset' : '2',
            WebkitBoxOrient: 'vertical',
          }}>
            {formatCreators()}
          </div>
        )}

        {labelSettings.showType && (
          <div style={{
            fontSize: typeSize,
            color: '#999',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: '600',
            marginBottom: spacing,
          }}>
            {item.type}
          </div>
        )}

        {/* Publisher */}
        {labelSettings.showPublisher && item.publisher && (
          <div style={{ 
            fontSize: infoSize,
            color: '#888',
            marginBottom: '3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.publisher}
          </div>
        )}
        
        {/* Year */}
        {labelSettings.showYear && item.publication_year && (
          <div style={{ 
            fontSize: infoSize,
            color: '#888',
            marginBottom: '3px',
          }}>
            {item.publication_year}
          </div>
        )}
        
        {/* ISBN */}
        {labelSettings.showIsbn && item.isbn && (
          <div style={{ 
            fontFamily: 'monospace',
            fontSize: `${parseInt(infoSize) - 1}px`,
            color: '#888',
            marginBottom: '3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            ISBN: {item.isbn}
          </div>
        )}
        
        {/* Location */}
        {labelSettings.showLocation && item.location && (
          <div style={{ 
            fontSize: infoSize,
            fontWeight: '600',
            color: '#666',
            marginBottom: '3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            📍 {item.location}
          </div>
        )}
        
        {/* URL at bottom */}
        {labelSettings.showUrl && (
          <div style={{ 
            width: '100%',
            marginTop: spacing,
          }}>
            <div style={{
              fontSize: urlSize,
              color: '#ccc',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {itemUrl}
            </div>
          </div>
        )}
      </div>
  );

  return (
    <div 
      style={{
        width: `${labelSettings.labelWidth}mm`,
        height: `${labelSettings.labelHeight}mm`,
        minHeight: `${labelSettings.labelHeight}mm`,
        padding: padding,
        display: 'flex',
        flexDirection: isLandscape ? 'row' : 'column',
        alignItems: isLandscape ? 'flex-start' : 'center',
        justifyContent: isLandscape ? 'flex-start' : 'space-between',
        color: '#000',
        boxSizing: 'border-box',
        overflow: 'hidden',
        gap: spacing,
        flexWrap: 'nowrap',
        pageBreakInside: 'avoid',
      }}
      className="label-item"
    >
      {/* Layout order depends on mirror setting */}
      {!isMirrored ? (
        <>
          {qrSection}
          {spineSection}
          {coverSection}
          {infoSection}
        </>
      ) : (
        <>
          {infoSection}
          {coverSection}
          {spineSection}
          {qrSection}
        </>
      )}
    </div>
  );
}
