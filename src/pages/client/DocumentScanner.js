/**
 * DocumentScanner.jsx
 *
 * A self-contained document scanner screen.
 *
 * HOW IT WORKS
 * ─────────────
 * 1. Parent mounts this component with an `onComplete(base64)` callback
 *    and an `onCancel()` callback.
 * 2. On mount, it immediately fires the native ML-Kit scanner
 *    (@capgo/capacitor-document-scanner).
 * 3. After ML-Kit returns, the scanned image is loaded into
 *    react-advanced-cropper so the user can fine-tune the crop.
 * 4. Tapping SAVE calls onComplete(base64jpeg).
 *    Tapping CANCEL (or dismissing ML-Kit) calls onCancel().
 *
 * INSTALL (once, in your project root)
 * ─────────────────────────────────────
 *   npm install @capgo/capacitor-document-scanner
 *   npx cap sync
 *
 * AndroidManifest.xml — make sure you have:
 *   <uses-permission android:name="android.permission.CAMERA" />
 *
 * NOTE: ML Kit does NOT work on Android emulators.
 *       Always test on a real device.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Cropper as AdvancedCropper } from 'react-advanced-cropper';
import { RotateCw, X, Check, ScanLine } from 'lucide-react';
import './CustomCropper.scss'; // reuse your existing cropper styles

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Converts a Capacitor file URI (file:///...) to a base64 JPEG string.
 * Uses fetch → blob → FileReader so it works inside the Android WebView.
 */
const fileUriToBase64 = async (fileUri) => {
  const webSrc = Capacitor.convertFileSrc(fileUri);
  const res    = await fetch(webSrc);
  const blob   = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);   // data:image/jpeg;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// ─────────────────────────────────────────────────────────────────
// DocumentScanner component
// ─────────────────────────────────────────────────────────────────

/**
 * Props
 * ─────
 * @param {function} onComplete  (base64: string) => void   — called with data-URL jpeg
 * @param {function} onCancel    () => void                  — called when user cancels
 * @param {object}   cropperAspectRatio  optional { width, height } for locked ratio
 *                   e.g. { width: 210, height: 60 } for the station header slot
 *                   Leave undefined for free crop (all other slots).
 */
const DocumentScannerScreen = ({ onComplete, onCancel, cropperAspectRatio }) => {
  const cropperRef = useRef(null);

  // 'scanning'  — ML Kit is open (no UI shown behind it)
  // 'cropping'  — ML Kit returned, show cropper
  // 'error'     — something went wrong
  const [phase, setPhase]       = useState('scanning');
  const [imageSrc, setImageSrc] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Fire ML Kit on mount ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const runScanner = async () => {
      // Safety: on web there is no ML Kit. Just cancel gracefully.
      if (!Capacitor.isNativePlatform()) {
        onCancel();
        return;
      }

      try {
        // Dynamic import — only resolved on the device at runtime,
        // never touched during react-scripts web build.
        const { DocumentScanner } = await import('@capgo/capacitor-document-scanner');

        const { scannedImages, status } = await DocumentScanner.scanDocument({
          maxNumDocuments: 1,
          quality: 95,
        });

        if (cancelled) return;

        if (status === 'cancel' || !scannedImages?.length) {
          onCancel();
          return;
        }

        // Convert file URI → base64 so the cropper & jsPDF can use it
        const b64 = await fileUriToBase64(scannedImages[0]);
        if (cancelled) return;

        setImageSrc(b64);
        setPhase('cropping');

      } catch (err) {
        if (cancelled) return;
        console.error('[DocumentScanner] error:', err);
        setErrorMsg(err?.message || 'Scan failed. Please try again.');
        setPhase('error');
      }
    };

    runScanner();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cropper actions ───────────────────────────────────────────
  const handleRotate = () => {
    cropperRef.current?.rotateImage(90);
  };

  const handleSave = () => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCanvas({ imageSmoothingQuality: 'high' });
    if (canvas) {
      onComplete(canvas.toDataURL('image/jpeg', 1.0));
    }
  };

  // ── Render: scanning phase (blank — ML Kit UI is on top) ──────
  if (phase === 'scanning') {
    return (
      <div style={styles.fullscreen}>
        {/* Subtle loading state shown briefly before ML Kit overlay appears */}
        <div style={styles.loadingWrap}>
          <div style={styles.scanIcon}>
            <ScanLine size={48} color="#fff" />
          </div>
          <p style={styles.loadingText}>Opening scanner…</p>
          <p style={styles.loadingSubtext}>Point your camera at the document</p>
        </div>
      </div>
    );
  }

  // ── Render: error phase ───────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={styles.fullscreen}>
        <div style={styles.loadingWrap}>
          <p style={{ color: '#f87171', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
            Scanner Error
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', marginBottom: 24 }}>
            {errorMsg}
          </p>
          <button onClick={onCancel} style={styles.cancelBtn}>Close</button>
        </div>
      </div>
    );
  }

  // ── Render: cropping phase ────────────────────────────────────
  return (
    <div style={styles.fullscreen}>

      {/* Top bar */}
      <div style={styles.topBar}>
        <button onClick={onCancel} style={styles.topBarBtn}>
          <X size={22} color="#fff" />
        </button>
        <span style={styles.topBarTitle}>Adjust Scan</span>
        <button onClick={handleSave} style={{ ...styles.topBarBtn, color: '#34d399', fontWeight: 700, fontSize: '0.9rem', gap: '4px', display: 'flex', alignItems: 'center' }}>
          <Check size={20} color="#34d399" />
          SAVE
        </button>
      </div>

      {/* Cropper */}
      <div style={styles.cropperWrap}>
        <AdvancedCropper
          ref={cropperRef}
          src={imageSrc}
          className="cropper"
          style={{ height: '100%', width: '100%' }}
          stencilProps={cropperAspectRatio
            ? { aspectRatio: cropperAspectRatio.width / cropperAspectRatio.height }
            : {}
          }
          // Default: select the entire image so user just confirms or trims
          defaultCoordinates={({ imageSize }) => ({
            left: 0, top: 0,
            width:  imageSize.width,
            height: imageSize.height,
          })}
        />
      </div>

      {/* Bottom toolbar — rotate only, nothing else */}
      <div style={styles.toolbar}>
        <button onClick={handleRotate} style={styles.toolBtn}>
          <RotateCw size={26} color="#fff" />
          <span style={styles.toolLabel}>ROTATE</span>
        </button>
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const styles = {
  fullscreen: {
    position:        'fixed',
    inset:           0,
    backgroundColor: '#000',
    zIndex:          19999,
    display:         'flex',
    flexDirection:   'column',
  },
  loadingWrap: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '12px',
    padding:        '24px',
  },
  scanIcon: {
    width:          88,
    height:         88,
    borderRadius:   '50%',
    background:     'rgba(59,130,246,0.15)',
    border:         '2px solid rgba(59,130,246,0.4)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   '8px',
  },
  loadingText: {
    color:      '#f1f5f9',
    fontWeight: 700,
    fontSize:   '1.1rem',
    margin:     0,
  },
  loadingSubtext: {
    color:     '#64748b',
    fontSize:  '0.85rem',
    margin:    0,
  },
  cancelBtn: {
    padding:      '12px 32px',
    borderRadius: '12px',
    background:   'rgba(255,255,255,0.08)',
    border:       '1px solid rgba(255,255,255,0.15)',
    color:        '#f1f5f9',
    fontWeight:   600,
    fontSize:     '0.95rem',
    cursor:       'pointer',
  },
  topBar: {
    display:         'flex',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         '16px 20px',
    paddingTop:      'max(16px, env(safe-area-inset-top))',
    background:      'rgba(0,0,0,0.7)',
    backdropFilter:  'blur(8px)',
  },
  topBarBtn: {
    background:  'none',
    border:      'none',
    color:       '#fff',
    cursor:      'pointer',
    padding:     '4px',
    borderRadius:'8px',
    lineHeight:  1,
  },
  topBarTitle: {
    color:        '#f1f5f9',
    fontWeight:   700,
    fontSize:     '0.95rem',
    letterSpacing:'0.05em',
    textTransform:'uppercase',
  },
  cropperWrap: {
    flex:     1,
    position: 'relative',
    overflow: 'hidden',
    padding:  '12px',
  },
  toolbar: {
    display:         'flex',
    justifyContent:  'center',
    alignItems:      'center',
    padding:         '24px 32px',
    paddingBottom:   'max(24px, env(safe-area-inset-bottom))',
    background:      'rgba(15,15,15,0.95)',
    gap:             '40px',
  },
  toolBtn: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '6px',
    background:     'none',
    border:         'none',
    cursor:         'pointer',
    padding:        '8px 16px',
    borderRadius:   '12px',
  },
  toolLabel: {
    color:        '#94a3b8',
    fontSize:     '0.65rem',
    fontWeight:   700,
    letterSpacing:'0.08em',
  },
};

export default DocumentScannerScreen;