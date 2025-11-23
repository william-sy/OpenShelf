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
    qrSize: 180,
    coverSize: 60,
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

  // Debug: Log settings to console
  console.log('ItemLabel settings:', labelSettings);
  console.log('Item data:', item);

  const itemUrl = `${labelSettings.baseUrl}/items/${item.id}`;
  const coverImageUrl = getImageUrl(item.cover_url);

  const formatCreators = () => {
    if (!item.creators || item.creators.length === 0) return '';
    return item.creators.map(c => c.name).join(', ');
  };

  // Calculate responsive sizes based on label dimensions
  const isSmallLabel = labelSettings.labelWidth < 100 || labelSettings.labelHeight < 100;
  const qrSize = labelSettings.qrSize || 180;
  const coverSize = labelSettings.coverSize || 60;
  
  const padding = isSmallLabel ? '4px' : '8px';
  const titleSize = isSmallLabel ? '10px' : '14px';
  const creatorSize = isSmallLabel ? '8px' : '11px';
  const typeSize = isSmallLabel ? '6px' : '9px';
  const infoSize = isSmallLabel ? '7px' : '10px';
  const urlSize = isSmallLabel ? '6px' : '8px';
  const spacing = isSmallLabel ? '4px' : '6px';

  return (
    <div 
      style={{
        width: `${labelSettings.labelWidth}mm`,
        height: `${labelSettings.labelHeight}mm`,
        maxWidth: `${labelSettings.labelWidth}mm`,
        maxHeight: `${labelSettings.labelHeight}mm`,
        pageBreakAfter: 'always',
        backgroundColor: 'white',
        padding: padding,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
        color: '#000',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Cover Image */}
      {labelSettings.showCover && coverImageUrl && (
        <div style={{ marginBottom: spacing, flexShrink: 0 }}>
          <img 
            src={coverImageUrl} 
            alt={item.title}
            style={{
              maxHeight: `${coverSize}px`,
              maxWidth: `${coverSize}px`,
              objectFit: 'contain',
            }}
            crossOrigin="anonymous"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* QR Code */}
      <div style={{
        marginBottom: spacing,
        backgroundColor: 'white',
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

      {/* Item Information */}
      <div style={{ 
        width: '100%',
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        maxHeight: '100%',
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
      </div>

      {/* URL at bottom */}
      {labelSettings.showUrl && (
        <div style={{ 
          width: '100%',
          marginTop: spacing,
          flexShrink: 0,
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
}
