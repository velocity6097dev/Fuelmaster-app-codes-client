import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import { triggerHaptic } from '../../utils/audio';
import { ImpactStyle } from '@capacitor/haptics';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { jsPDF } from 'jspdf';
import {
  UploadCloud, X, Loader2, Building, CalendarDays, Settings2,
  FileCheck2, Crop, RotateCw, Camera as CameraIcon, Image as ImageIcon,
  FileText, Receipt, Paperclip, Eye, Download, RotateCcw, CheckCircle2,
  ScanLine,
} from 'lucide-react';
import { Cropper as AdvancedCropper } from 'react-advanced-cropper';
import './CustomCropper.scss';
import { useSystem } from '../../context/SystemContext';
import DocumentScannerScreen from './DocumentScanner'; // ← scanner component

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const IMAGE_TARGETS = ['header', 'cert', 'receipt', 'supporting'];

const TARGET_LABELS = {
  header: 'Station Letterhead',
  cert:   'W&M Certificate',
  receipt: 'GRN Receipt',
  supporting: 'Extra Document',
};

// ─────────────────────────────────────────────
// CUSTOM DATE INPUT
// ─────────────────────────────────────────────
const CustomDateInput = ({ value, onChange, placeholder = 'DD-MM-YYYY' }) => {
  const display = value
    ? value.split('-').reverse().join('-')
    : placeholder;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Visible label layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          paddingRight: '36px',
          pointerEvents: 'none',
          color: value ? 'var(--text-main)' : 'var(--text-muted, #9ca3af)',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {display}
      </div>

      {/* Invisible native date picker on top */}
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="hidden-date-input"
        style={{
          width: '100%',
          opacity: 0,           /* completely invisible */
          position: 'relative',
          zIndex: 2,
          cursor: 'pointer',
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// MEDIA SOURCE PICKER BOTTOM-SHEET
// ─────────────────────────────────────────────
const MediaPickerSheet = ({ targetName, onPickCamera, onPickGallery, onScanDocument, onClose }) => {
  if (!targetName) return null;

  const label    = TARGET_LABELS[targetName] || 'Image';
  const isNative = Capacitor.isNativePlatform();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 11000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          background: 'var(--surface, #ffffff)',
          borderRadius: '24px 24px 0 0',
          padding: '8px 0 40px',
          animation: 'slideUpSheet 0.28s cubic-bezier(0.32,0.72,0,1)',
          boxShadow: '0 -4px 40px rgba(0,0,0,0.18)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4px', paddingBottom: '16px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--border, #e5e7eb)' }} />
        </div>

        {/* Title */}
        <div style={{ paddingInline: '24px', paddingBottom: '20px' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted, #9ca3af)' }}>
            Select source for
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {label}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingInline: '16px' }}>

          {/* Scan Document — native only, ML Kit */}
          {isNative && (
            <PickerOption
              icon={<ScanLine size={24} />}
              label="Scan Document"
              sublabel="Auto edge detection · ML Kit"
              accent="#f59e0b"
              onClick={onScanDocument}
            />
          )}

          <PickerOption
            icon={<CameraIcon size={24} />}
            label="Take Photo"
            sublabel="Open camera"
            accent="#3b82f6"
            onClick={onPickCamera}
          />
          <PickerOption
            icon={<ImageIcon size={24} />}
            label="Choose from Gallery"
            sublabel="Browse existing photos"
            accent="#8b5cf6"
            onClick={onPickGallery}
          />
        </div>

        {/* Cancel */}
        <div style={{ paddingInline: '16px', marginTop: '12px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '14px',
              background: 'var(--bg-body, #f8fafc)',
              border: '1px solid var(--border, #e5e7eb)',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const PickerOption = ({ icon, label, sublabel, accent, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      width: '100%',
      padding: '16px',
      borderRadius: '16px',
      background: 'var(--bg-body, #f8fafc)',
      border: `1.5px solid ${accent}22`,
      cursor: 'pointer',
      textAlign: 'left',
      transition: 'background 0.15s, transform 0.1s',
      WebkitTapHighlightColor: 'transparent',
    }}
    onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.98)'; }}
    onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    <div style={{
      width: '48px', height: '48px', borderRadius: '14px',
      background: `${accent}18`, color: accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sublabel}</p>
    </div>
  </button>
);

// ─────────────────────────────────────────────
// ATTACHMENT CARD
// ─────────────────────────────────────────────
const AttachmentCard = ({ target, image, icon: Icon, label, onOpen, onRemove }) => (
  <div
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-body)',
      padding: '12px 6px',
      borderRadius: '14px',
      border: image
        ? '1.5px solid var(--success, #10b981)'
        : '1.5px dashed var(--border)',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100px',
      transition: 'border-color 0.2s',
    }}
  >
    {image ? (
      <>
        <img
          src={image}
          alt={label}
          style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
        />
        {/* Green tick badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: 'var(--success, #10b981)', borderRadius: '50%',
          width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle2 size={13} color="#fff" />
        </div>
        <button
          onClick={onRemove}
          style={{
            position: 'absolute', top: 5, right: 5,
            background: 'rgba(0,0,0,0.55)', color: 'white',
            border: 'none', borderRadius: '50%', padding: '4px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={13} />
        </button>
      </>
    ) : (
      <div
        onClick={onOpen}
        style={{
          textAlign: 'center', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
        }}
      >
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: 'var(--primary-light, #eff6ff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color="var(--primary)" />
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3 }}>
          {label}
        </div>
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const ReimbursementInvoice = () => {
  const { showAlert } = useSystem();

  // --- FORM STATE ---
  const [pumpHeaderImg, setPumpHeaderImg] = useState(null);
  const [dealerCode, setDealerCode]       = useState('');
  const [vendorCode, setVendorCode]       = useState('');
  const [invoiceNo, setInvoiceNo]         = useState('');
  const [gstin, setGstin]                 = useState('');
  const [panNo, setPanNo]                 = useState('');
  const [dealerName, setDealerName]       = useState('');
  const [invoiceDate, setInvoiceDate]     = useState(new Date().toISOString().split('T')[0]);
  const [stampingDate, setStampingDate]   = useState(new Date().toISOString().split('T')[0]);
  const [grnNo, setGrnNo]                 = useState('');
  const [grnDate, setGrnDate]             = useState('');
  const [certNo, setCertNo]               = useState('');
  const [certDate, setCertDate]           = useState('');
  const [mpdModel, setMpdModel]           = useState('MIDCO');
  const [mpdNozzles, setMpdNozzles]       = useState('');
  const [additionalCharges, setAdditionalCharges] = useState('0');

  const [certImg, setCertImg]             = useState(null);
  const [receiptImg, setReceiptImg]       = useState(null);
  const [supportingImg, setSupportingImg] = useState(null);
  const [isGenerating, setIsGenerating]   = useState(false);

  // --- UI STATE ---
  const [showPreviewModal, setShowPreviewModal]   = useState(false);
  const [showResetConfirm, setShowResetConfirm]   = useState(false);
  const [pickerTarget, setPickerTarget]           = useState(null); // which target the sheet is open for
  const [scannerTarget, setScannerTarget]         = useState(null); // which target the scanner is open for

  // --- CROPPER STATE ---
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editorSrc, setEditorSrc]     = useState(null);
  const [editorTarget, setEditorTarget] = useState(null);
  const cropperRef = useRef(null);

  // Hidden file inputs (web fallback)
  const fileInputRefs = {
    header:     useRef(null),
    cert:       useRef(null),
    receipt:    useRef(null),
    supporting: useRef(null),
  };

  // --- IMAGE STATE MAP ---
  const imageMap = { header: pumpHeaderImg, cert: certImg, receipt: receiptImg, supporting: supportingImg };
  const imageSetters = {
    header:     setPumpHeaderImg,
    cert:       setCertImg,
    receipt:    setReceiptImg,
    supporting: setSupportingImg,
  };
  const saveImage = (base64, target) => imageSetters[target]?.(base64);
  const clearImage = (target) => imageSetters[target]?.(null);

  // --- LOCAL STORAGE ---
  useEffect(() => {
    const saved = {
      vendorCode: localStorage.getItem('wm_vendorCode'),
      gstin:      localStorage.getItem('wm_gstin'),
      panNo:      localStorage.getItem('wm_panNo'),
      dealerName: localStorage.getItem('wm_dealerName'),
    };
    if (saved.vendorCode) setVendorCode(saved.vendorCode);
    if (saved.gstin)      setGstin(saved.gstin);
    if (saved.panNo)      setPanNo(saved.panNo);
    if (saved.dealerName) setDealerName(saved.dealerName);
  }, []);

  useEffect(() => {
    localStorage.setItem('wm_vendorCode', vendorCode);
    localStorage.setItem('wm_gstin',      gstin);
    localStorage.setItem('wm_panNo',      panNo);
    localStorage.setItem('wm_dealerName', dealerName);
  }, [vendorCode, gstin, panNo, dealerName]);

  // --- AUTO-FILL ---
  const handleDealerCodeChange = (e) => {
    const val = e.target.value.toUpperCase();
    setDealerCode(val);
    if (!invoiceNo || invoiceNo.endsWith('/WM0001')) {
      setInvoiceNo(val ? `${val}/WM0001` : '');
    }
  };

  const handleGstinChange = (e) => {
    const val = e.target.value.toUpperCase();
    setGstin(val);
    setPanNo(val.length >= 12 ? val.substring(2, 12) : '');
  };

  // --- MATH ---
  const nozzles       = parseInt(mpdNozzles) || 0;
  const stampingFee   = nozzles * 1500;
  const numAddAmt     = parseFloat(additionalCharges) || 0;
  const grandTotal    = stampingFee + numAddAmt;

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const a = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ',
               'Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ',
               'Eighteen ','Nineteen '];
    const b = ['','','Twenty ','Thirty ','Forty ','Fifty ','Sixty ','Seventy ','Eighty ','Ninety '];
    if ((num = num.toString()).length > 9) return 'Overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += n[1] != 0 ? (a[Number(n[1])] || b[n[1][0]] + a[n[1][1]]) + 'Crore '    : '';
    str += n[2] != 0 ? (a[Number(n[2])] || b[n[2][0]] + a[n[2][1]]) + 'Lakh '     : '';
    str += n[3] != 0 ? (a[Number(n[3])] || b[n[3][0]] + a[n[3][1]]) + 'Thousand ' : '';
    str += n[4] != 0 ? (a[Number(n[4])] || b[n[4][0]] + a[n[4][1]]) + 'Hundred '  : '';
    str += n[5] != 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + a[n[5][1]]) : '';
    return str.trim() + ' Only';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return dateStr.split('-').reverse().join('-');
  };

  const getFinancialYear = (dateStr) => {
    if (!dateStr) return '2025-26';
    const d     = new Date(dateStr);
    const year  = d.getFullYear();
    const month = d.getMonth();
    return month < 3
      ? `${year - 1}-${year.toString().slice(-2)}`
      : `${year}-${(year + 1).toString().slice(-2)}`;
  };

  // ─────────────────────────────────────────────
  // IMAGE ACQUISITION
  // ─────────────────────────────────────────────

  /**
   * openSourcePicker
   * On native: shows our custom bottom-sheet then delegates to pickWithSource()
   * On web:    shows our custom bottom-sheet (camera option triggers <input capture>, gallery triggers normal <input>)
   */
  const openSourcePicker = (targetName) => {
    try { triggerHaptic(ImpactStyle.Light); } catch (_) {}
    setPickerTarget(targetName);
  };

  const closePickerSheet = () => setPickerTarget(null);

  // Called when user taps "Take Photo" in the sheet
  const handlePickCamera = async () => {
    const target = pickerTarget;
    closePickerSheet();

    if (Capacitor.isNativePlatform()) {
      await pickNative(target, CameraSource.Camera);
    } else {
      // Programmatically set capture attribute and click
      const input = fileInputRefs[target]?.current;
      if (input) {
        input.setAttribute('capture', 'environment');
        input.click();
      }
    }
  };

  // Called when user taps "Choose from Gallery" in the sheet
  const handlePickGallery = async () => {
    const target = pickerTarget;
    closePickerSheet();

    if (Capacitor.isNativePlatform()) {
      await pickNative(target, CameraSource.Photos);
    } else {
      const input = fileInputRefs[target]?.current;
      if (input) {
        input.removeAttribute('capture');
        input.click();
      }
    }
  };

  // Called when user taps "Scan Document" in the sheet (native only)
  const handleScanDocument = () => {
    const target = pickerTarget;
    closePickerSheet();
    try { triggerHaptic(ImpactStyle.Medium); } catch (_) {}
    setScannerTarget(target); // mount DocumentScannerScreen
  };

  // Called by DocumentScannerScreen when user taps SAVE
  const handleScannerComplete = (base64) => {
    saveImage(base64, scannerTarget);
    setScannerTarget(null);
  };

  // Called by DocumentScannerScreen when user cancels
  const handleScannerCancel = () => {
    setScannerTarget(null);
  };

  const pickNative = async (targetName, source) => {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
        promptLabelHeader: 'Select Image Source',
        promptLabelPhoto:   'Choose from Gallery',
        promptLabelPicture: 'Take Photo',
      });
      if (image?.dataUrl) processAndOpenEditor(image.dataUrl, targetName);
    } catch (err) {
      console.log('Image capture cancelled or failed', err);
    }
  };

  // ─────────────────────────────────────────────
  // CROPPER
  // ─────────────────────────────────────────────
  const onWebFileSelect = (e, targetName) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => processAndOpenEditor(reader.result, targetName);
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = '';
    }
  };

  const processAndOpenEditor = (dataUrl, targetName) => {
    setEditorSrc(dataUrl);
    setEditorTarget(targetName);
    setEditorOpen(true);
  };

  const handleRotate = () => {
    if (!cropperRef.current) return;
    try { triggerHaptic(ImpactStyle.Light); } catch (_) {}
    cropperRef.current.rotateImage(90);
  };

  const applyCropAndRotation = () => {
    if (!cropperRef.current) return;
    try { triggerHaptic(ImpactStyle.Light); } catch (_) {}
    // For non-header: export at full native resolution (no maxWidth/maxHeight cap)
    const canvasOptions = editorTarget === 'header'
      ? { imageSmoothingQuality: 'high', maxWidth: 2100, maxHeight: 600 }
      : { imageSmoothingQuality: 'high' };
    const canvas = cropperRef.current.getCanvas(canvasOptions);
    if (canvas) {
      saveImage(canvas.toDataURL('image/jpeg', 1.0), editorTarget);
      closeEditor();
    }
  };

  const closeEditor = () => { setEditorOpen(false); setEditorSrc(null); setEditorTarget(null); };

  // ─────────────────────────────────────────────
  // PDF GENERATOR
  // ─────────────────────────────────────────────
  const downloadPDF = async () => {
    if (showPreviewModal) setShowPreviewModal(false);

    if (!dealerCode || !invoiceNo || !gstin) {
      setTimeout(() => showAlert('Please fill in Dealer Code, Invoice No, and GSTIN!', 'Missing Information'), 150);
      return;
    }

    try { triggerHaptic(ImpactStyle.Heavy); } catch (_) {}
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const doc = new jsPDF({ format: 'a4', unit: 'mm' });
      const startX = 15; const pageW = 180; let y = 60;

      if (pumpHeaderImg) {
        doc.addImage(pumpHeaderImg, 'JPEG', 0, 0, 210, 60);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(0, 0, 210, 60, 'F');
        doc.setFontSize(12); doc.setTextColor(148, 163, 184);
        doc.text('NO STATION HEADER PROVIDED', 105, 30, { align: 'center' });
      }

      const printText = (text, x, curY, size = 10, font = 'helvetica', style = 'normal', align = 'left') => {
        doc.setFontSize(size);
        doc.setFont(font, style);
        doc.setTextColor(0, 0, 0);
        doc.text(text, x, curY, { align });
      };

      doc.setLineWidth(0.4);
      doc.rect(12, y + 8, pageW + 6, 200);

      printText('INVOICE', 105, y + 15, 14, 'helvetica', 'bold', 'center');
      y += 22;

      doc.setLineWidth(0.2);
      doc.rect(startX, y, pageW, 16);
      doc.line(startX, y + 8, startX + pageW, y + 8);
      doc.line(startX + 90, y, startX + 90, y + 16);

      printText('INVOICE NO:',   startX + 2,   y + 5,  9, 'helvetica', 'bold');
      printText(invoiceNo,       startX + 25,  y + 5,  9);
      printText('VENDOR CODE :', startX + 92,  y + 5,  9, 'helvetica', 'bold');
      printText(vendorCode || 'N/A', startX + 120, y + 5, 9);
      printText('INVOICE DATE:', startX + 2,   y + 13, 9, 'helvetica', 'bold');
      printText(formatDate(invoiceDate), startX + 28, y + 13, 9);
      printText('GSTN NO :',    startX + 92,  y + 13, 9, 'helvetica', 'bold');
      printText(gstin || 'N/A', startX + 112, y + 13, 9);

      y += 16;
      doc.rect(startX, y, pageW, 8);
      doc.line(startX + 90, y, startX + 90, y + 8);
      printText('PAN NO :',     startX + 92, y + 5, 9, 'helvetica', 'bold');
      printText(panNo || 'N/A', startX + 110, y + 5, 9);

      y += 12;
      printText('Subject: Reimbursement of Stamping Fee', 105, y + 5, 10, 'helvetica', 'bold', 'center');
      doc.line(75, y + 6, 135, y + 6);

      y += 12;
      doc.rect(startX, y, pageW, 25);
      doc.line(startX + 90, y, startX + 90, y + 25);
      printText('Consignee/Buyer Address:',     startX + 2,  y + 5,  9, 'helvetica', 'bold');
      printText('Bharat Petroleum Corporation Limited', startX + 2, y + 10, 8, 'helvetica', 'bold');
      printText('Bharat Bhavan, Plot No.31\nPrince Gulam Md.Shah Road,\nGolf Green, Kolkata-700095', startX + 2, y + 14, 8);
      printText('Billing Address:',             startX + 92, y + 5,  9, 'helvetica', 'bold');
      printText('M/s Bharat Petroleum Corporation Limited', startX + 92, y + 10, 8, 'helvetica', 'bold');
      printText('Business Excellence center (BPEC)\nPlot No.6, Sector-2\nBehind CIDCO Garden. Kahargar,\nNAVI MUMBAI-410210', startX + 92, y + 14, 8);

      y += 25;
      doc.rect(startX, y, pageW, 8);
      printText('BPCL PAN NO:AAACB2902M   GSTN : 19AAACB2902M1ZQ', startX + 2, y + 5, 9, 'helvetica', 'bold');

      y += 8;
      doc.rect(startX, y, pageW, 8);
      printText('SR NO.',      startX + 5,   y + 5, 8, 'helvetica', 'bold');
      printText('HSN/SAC',     startX + 20,  y + 5, 8, 'helvetica', 'bold');
      printText('Description', startX + 45,  y + 5, 8, 'helvetica', 'bold');
      printText('QNTY',        startX + 130, y + 5, 8, 'helvetica', 'bold');
      printText('RATE',        startX + 145, y + 5, 8, 'helvetica', 'bold');
      printText('Amount',      startX + 165, y + 5, 8, 'helvetica', 'bold');

      y += 8;
      const tableHeight = numAddAmt > 0 ? 20 : 12;
      doc.rect(startX, y, pageW, tableHeight);
      doc.line(startX + 15,  y - 8, startX + 15,  y + tableHeight);
      doc.line(startX + 40,  y - 8, startX + 40,  y + tableHeight);
      doc.line(startX + 125, y - 8, startX + 125, y + tableHeight);
      doc.line(startX + 140, y - 8, startX + 140, y + tableHeight);
      doc.line(startX + 160, y - 8, startX + 160, y + tableHeight);

      const fy = getFinancialYear(stampingDate);
      printText('1',     startX + 5,   y + 6, 9);
      printText('996211', startX + 20, y + 6, 9);
      printText(`Stamping fee for the year ${fy}`, startX + 42, y + 6, 9);
      printText(nozzles.toString(), startX + 130, y + 6, 9);
      printText('1500.00',          startX + 142, y + 6, 9);
      printText(stampingFee.toFixed(2), startX + 162, y + 6, 9);

      if (numAddAmt > 0) {
        printText('2',                              startX + 5,   y + 14, 9);
        printText('Conveyance / Additional T.A.',   startX + 42,  y + 14, 9);
        printText('1',                              startX + 130, y + 14, 9);
        printText(numAddAmt.toFixed(2),             startX + 142, y + 14, 9);
        printText(numAddAmt.toFixed(2),             startX + 162, y + 14, 9);
      }

      y += tableHeight;
      doc.rect(startX, y, pageW, 20);
      doc.line(startX + 125, y,       pageW + startX, y);
      doc.line(startX + 160, y,       pageW + startX, y);
      doc.line(startX + 125, y + 6.6, pageW + startX, y + 6.6);
      doc.line(startX + 125, y + 13.3, pageW + startX, y + 13.3);

      const splitWords = doc.splitTextToSize(`(Rs. ${numberToWords(grandTotal)})`, 120);
      printText(splitWords,               startX + 2,    y + 10, 9, 'helvetica', 'bold');
      printText('CGST',                   startX + 140,  y + 5,  9, 'helvetica', 'normal', 'right');
      printText('NA',                     startX + 170,  y + 5,  9, 'helvetica', 'normal', 'center');
      printText('SGST',                   startX + 140,  y + 11, 9, 'helvetica', 'normal', 'right');
      printText('NA',                     startX + 170,  y + 11, 9, 'helvetica', 'normal', 'center');
      printText('TOTAL',                  startX + 140,  y + 18, 9, 'helvetica', 'bold',   'right');
      printText(grandTotal.toFixed(2),    startX + 170,  y + 18, 9, 'helvetica', 'bold',   'center');

      y += 20;
      doc.rect(startX, y, pageW, 15);
      printText('Enclosure:', startX + 2, y + 5, 9, 'helvetica', 'bold');
      doc.line(startX + 2, y + 5.5, startX + 19, y + 5.5);
      printText(`Original Receipt GRN No. ${grnNo || '______________'}   Dated: ${formatDate(grnDate)}`, startX + 22, y + 5, 9);
      printText(`Original Certificate No- ${certNo || '______________'}   Dated: ${formatDate(certDate)}`, startX + 22, y + 11, 9);

      printText(`For ${dealerName || 'Bahar Service Station'}`, pageW - 20, y + 52, 10, 'helvetica', 'bold',   'center');
      printText('(Name/Signature/Seal of the Dealer)',           pageW - 20, y + 58, 9,  'helvetica', 'normal', 'center');

      // Attach images on separate A4 pages.
      // Uses a two-stage Image load with a generous timeout so it works on
      // Android WebView where img.onload can be slow or race with the PDF thread.
      const fitImageToA4Fixed = (base64Img) => {
        return new Promise((resolve) => {
          const W = 210, H = 297;

          const addToDoc = (srcB64, natW, natH) => {
            let finalSrc = srcB64;
            let w = natW, h = natH;

            // Auto-rotate landscape images to portrait
            if (natW > natH) {
              const cvs = document.createElement('canvas');
              cvs.width  = natH;
              cvs.height = natW;
              const ctx = cvs.getContext('2d');
              const tempImg = new Image();
              tempImg.src = srcB64;
              ctx.translate(cvs.width / 2, cvs.height / 2);
              ctx.rotate(Math.PI / 2);
              ctx.drawImage(tempImg, -natW / 2, -natH / 2);
              finalSrc = cvs.toDataURL('image/jpeg', 0.92);
              w = natH; h = natW;
            }

            doc.addPage('a4', 'p');
            const imgRatio  = w / h;
            const pageRatio = W / H;
            let fW, fH;
            if (imgRatio > pageRatio) { fW = W - 20; fH = fW / imgRatio; }
            else                      { fH = H - 20; fW = fH * imgRatio; }
            try {
              doc.addImage(finalSrc, 'JPEG', (W - fW) / 2, (H - fH) / 2, fW, fH);
            } catch (e) {
              console.warn('addImage failed, skipping attachment:', e);
            }
            resolve();
          };

          const img = new Image();
          // Timeout safety net — if onload never fires on this WebView, skip gracefully
          const timeout = setTimeout(() => {
            console.warn('Image load timed out, skipping attachment');
            resolve();
          }, 8000);

          img.onload = () => {
            clearTimeout(timeout);
            addToDoc(base64Img, img.naturalWidth || img.width, img.naturalHeight || img.height);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            console.warn('Image onerror, skipping attachment');
            resolve(); // resolve (not reject) so PDF still saves
          };

          // Assign src AFTER handlers are set
          img.src = base64Img;

          // On some Android WebViews the image is already decoded synchronously
          // before onload fires — force a flush
          if (img.complete && img.naturalWidth > 0) {
            clearTimeout(timeout);
            addToDoc(base64Img, img.naturalWidth, img.naturalHeight);
          }
        });
      };

      if (certImg)       await fitImageToA4Fixed(certImg);
      if (receiptImg)    await fitImageToA4Fixed(receiptImg);
      if (supportingImg) await fitImageToA4Fixed(supportingImg);

      const safeFileName = (invoiceNo || 'Draft').replace(/[/\\?%*:|"<>]/g, '-');

      if (Capacitor.isNativePlatform()) {
        try {
          const base64Data = doc.output('datauristring').split(',')[1];
          const fileName   = `Reimbursement_${safeFileName}_${Date.now()}.pdf`;
          const savedFile  = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache, recursive: true });
          await Share.share({ title: 'Share Reimbursement Invoice', url: savedFile.uri, dialogTitle: 'Save or Share PDF' });
        } catch (nativeErr) {
          showAlert(`Error triggering Share: ${nativeErr.message || 'Ensure app permissions.'}`, 'Export Error');
        }
      } else {
        doc.save(`Reimbursement_${safeFileName}.pdf`);
      }

    } catch (error) {
      console.error('PDF Generation Error:', error);
      showAlert('Error generating PDF. Make sure your images are fully loaded.', 'Generation Error');
    } finally {
      setIsGenerating(false);
    }
  };

  // ─────────────────────────────────────────────
  // RESET
  // ─────────────────────────────────────────────
  const executeReset = () => {
    try { triggerHaptic(ImpactStyle.Light); } catch (_) {}
    setDealerCode(''); setVendorCode(''); setInvoiceNo('');
    setGstin('');      setPanNo('');      setDealerName('');
    setInvoiceDate(''); setStampingDate(''); // ← fix: was missing stampingDate
    setGrnNo('');      setGrnDate('');
    setCertNo('');     setCertDate('');
    setMpdModel('MIDCO'); setMpdNozzles(''); setAdditionalCharges('0');
    IMAGE_TARGETS.forEach(t => clearImage(t));
    ['wm_vendorCode','wm_gstin','wm_panNo','wm_dealerName'].forEach(k => localStorage.removeItem(k));
    setShowResetConfirm(false);
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Navbar title="W&M Reimbursement" />

      <main className="main-content" style={{ paddingTop: '10px' }}>

        {/* Hidden file inputs (web) */}
        {IMAGE_TARGETS.map(t => (
          <input
            key={t}
            type="file"
            accept="image/*"
            ref={fileInputRefs[t]}
            onChange={(e) => onWebFileSelect(e, t)}
            style={{ display: 'none' }}
          />
        ))}

        {/* ── Station Header Upload ── */}
        <div style={{
          height: '226px', width: '100%',
          backgroundColor: 'var(--surface)',
          border: pumpHeaderImg ? 'none' : '2px dashed var(--border)',
          borderRadius: '16px', marginBottom: '24px',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {pumpHeaderImg ? (
            <>
              <img src={pumpHeaderImg} alt="Header" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <button
                onClick={() => { try { triggerHaptic(ImpactStyle.Light); } catch (_) {} clearImage('header'); }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <div onClick={() => openSourcePicker('header')} style={{ cursor: 'pointer', textAlign: 'center', color: 'var(--text-muted)' }}>
              <UploadCloud size={40} style={{ opacity: 0.5, margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>Station Letterhead</p>
              <p style={{ fontSize: '0.8rem', marginTop: '5px' }}>Top 6cm PDF Print Space</p>
            </div>
          )}
        </div>

        {/* ── Dealer Info ── */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '24px' }}>
          <div className="card-head"><h3><Building size={20} color="var(--primary)" /> Dealer Info</h3></div>
          <div className="grid-2">
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Dealer Code</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={dealerCode} onChange={handleDealerCodeChange} placeholder="e.g. 119934" />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Vendor Code</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={vendorCode} onChange={(e) => setVendorCode(e.target.value)} placeholder="e.g. 375911" />
            </div>
          </div>
          <div className="input-group" style={{ marginTop: '16px' }}>
            <label>Invoice No.</label>
            <input type="text" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
          </div>
          <div className="input-group">
            <label>GSTIN</label>
            <input type="text" value={gstin} onChange={handleGstinChange} placeholder="22AAAAA0000A1Z5" maxLength={15} />
          </div>
          <div className="input-group">
            <label>PAN No (Auto-extracted)</label>
            <input type="text" value={panNo} onChange={(e) => setPanNo(e.target.value)} readOnly style={{ backgroundColor: 'var(--bg-body)' }} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Dealer Name</label>
            <input type="text" value={dealerName} onChange={(e) => setDealerName(e.target.value)} placeholder="e.g. Bahar Service Station" />
          </div>
        </div>

        {/* ── Dates & References ── */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '24px' }}>
          <div className="card-head"><h3><CalendarDays size={20} color="var(--primary)" /> Dates &amp; References</h3></div>
          <div className="grid-2" style={{ marginBottom: 15, minWidth: 0 }}>
            <div className="input-group" style={{ marginBottom: 0, minWidth: 0 }}><label>Invoice Date</label><CustomDateInput value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></div>
            <div className="input-group" style={{ marginBottom: 0, minWidth: 0 }}><label>Stamping Date</label><CustomDateInput value={stampingDate} onChange={(e) => setStampingDate(e.target.value)} /></div>
          </div>
          <div className="grid-2" style={{ marginBottom: 15 }}>
            <div className="input-group" style={{ marginBottom: 0 }}><label>GRN No.</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={grnNo} onChange={(e) => setGrnNo(e.target.value)} placeholder="e.g. 1920252..." /></div>
            <div className="input-group" style={{ marginBottom: 15, minWidth: 0 }}><label>GRN Date</label><CustomDateInput value={grnDate} onChange={(e) => setGrnDate(e.target.value)} /></div>
          </div>
          <div className="grid-2" style={{ marginBottom: 0 }}>
            <div className="input-group" style={{ marginBottom: 0 }}><label>Certificate No.</label><input type="text" value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="e.g. WB/15/..." /></div>
            <div className="input-group" style={{ marginBottom: 15, minWidth: 0 }}><label>Certificate Date</label><CustomDateInput value={certDate} onChange={(e) => setCertDate(e.target.value)} /></div>
          </div>
        </div>

        {/* ── Equipment & Pricing ── */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '24px' }}>
          <div className="card-head"><h3><Settings2 size={20} color="var(--primary)" /> Equipment &amp; Pricing</h3></div>
          <div className="input-group">
            <label>MPD Make / Model</label>
            <select value={mpdModel} onChange={(e) => setMpdModel(e.target.value)}>
              {['MIDCO','GILBARCO','WAYNE','TOKHEIM','TATSUNO','OTHER'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="input-group" style={{ marginBottom: 0 }}><label>No. of Nozzles</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={mpdNozzles} onChange={(e) => setMpdNozzles(e.target.value)} placeholder="0" /></div>
            <div className="input-group" style={{ marginBottom: 0 }}><label>Rate per Nozzle (₹)</label><input type="text" value="1500" readOnly style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-muted)' }} /></div>
          </div>
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label>Conveyance / Additional T.A. (₹)</label>
            <input type="text" inputMode="decimal" value={additionalCharges} onChange={(e) => setAdditionalCharges(e.target.value)} placeholder="0.00" />
          </div>

          <div style={{ background: 'var(--primary-light)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(37,99,235,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Stamping Fee ({nozzles} × ₹1500):</span>
              <span style={{ fontWeight: 600 }}>₹{stampingFee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Additional T.A. / Conveyance:</span>
              <span style={{ fontWeight: 600 }}>₹{numAddAmt.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed var(--border)', fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>GRAND TOTAL:</span>
              <span style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── Attachments ── */}
        <div className="content-card animate__animated animate__fadeIn" style={{ marginBottom: '30px' }}>
          <div className="card-head"><h3><FileCheck2 size={20} color="var(--primary)" /> Full Page Attachments</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <AttachmentCard target="cert"       image={certImg}       icon={FileText}  label="W&M Cert"   onOpen={() => openSourcePicker('cert')}       onRemove={() => clearImage('cert')} />
            <AttachmentCard target="receipt"    image={receiptImg}    icon={Receipt}   label="Receipt"    onOpen={() => openSourcePicker('receipt')}    onRemove={() => clearImage('receipt')} />
            <AttachmentCard target="supporting" image={supportingImg} icon={Paperclip} label="Extra Doc"  onOpen={() => openSourcePicker('supporting')} onRemove={() => clearImage('supporting')} />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => setShowPreviewModal(true)}
            disabled={isGenerating}
            style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '12px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <Eye size={20} /> Preview Details
          </button>
          <button
            onClick={downloadPDF}
            disabled={isGenerating}
            style={{ padding: '16px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer', opacity: isGenerating ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {isGenerating
              ? <><Loader2 className="spinner-mini darker" /> Generating PDF...</>
              : <><Download size={20} /> Download &amp; Share</>}
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{ padding: '14px', fontSize: '1rem', fontWeight: 600, borderRadius: '12px', background: 'transparent', color: '#ef4444', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <RotateCcw size={20} /> Reset
          </button>
        </div>
      </main>

      {/* ══════════════════════════════
          MEDIA SOURCE PICKER SHEET
      ══════════════════════════════ */}
      <MediaPickerSheet
        targetName={pickerTarget}
        onPickCamera={handlePickCamera}
        onPickGallery={handlePickGallery}
        onScanDocument={handleScanDocument}
        onClose={closePickerSheet}
      />

      {/* ══════════════════════════════
          DOCUMENT SCANNER SCREEN
          Mounts fullscreen when scannerTarget is set.
          DocumentScannerScreen fires ML Kit on mount,
          then shows the cropper — no other buttons.
      ══════════════════════════════ */}
      {scannerTarget && (
        <DocumentScannerScreen
          onComplete={handleScannerComplete}
          onCancel={handleScannerCancel}
          cropperAspectRatio={
            scannerTarget === 'header'
              ? { width: 210, height: 60 }   // locked ratio for letterhead
              : undefined                     // free crop for all other slots
          }
        />
      )}

      {/* ══════════════════════════════
          PREVIEW MODAL
      ══════════════════════════════ */}
      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--surface, #ffffff)', width: '100%', maxWidth: '400px', maxHeight: '85vh', overflowY: 'auto', borderRadius: '20px', padding: '24px', animation: 'slideUp 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-main)' }}>Invoice Summary</h2>
              <button onClick={() => setShowPreviewModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', color: 'var(--primary)', fontWeight: 700 }}>DEALER INFO</p>
                <p style={{ margin: 0 }}><strong>Name:</strong> {dealerName || 'Not Entered'}</p>
                <p style={{ margin: '4px 0' }}><strong>Code:</strong> {dealerCode || 'N/A'} | <strong>Vendor:</strong> {vendorCode || 'N/A'}</p>
                <p style={{ margin: '4px 0' }}><strong>Invoice No:</strong> {invoiceNo || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>GSTIN:</strong> {gstin || 'N/A'}</p>
                <p style={{ margin: '4px 0' }}><strong>PAN No:</strong> {panNo || 'N/A'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', color: 'var(--primary)', fontWeight: 700 }}>DATES &amp; REFS</p>
                <p style={{ margin: 0 }}><strong>Invoice Date:</strong> {formatDate(invoiceDate)}</p>
                <p style={{ margin: '4px 0' }}><strong>Stamping Date:</strong> {formatDate(stampingDate)}</p>
                <p style={{ margin: '4px 0' }}><strong>GRN No:</strong> {grnNo || 'N/A'} ({formatDate(grnDate)})</p>
                <p style={{ margin: 0 }}><strong>Cert No:</strong> {certNo || 'N/A'} ({formatDate(certDate)})</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', color: 'var(--primary)', fontWeight: 700 }}>FINANCIALS &amp; EQUIPMENT</p>
                <p style={{ margin: 0 }}><strong>Model:</strong> {mpdModel}</p>
                <p style={{ margin: '4px 0' }}><strong>Nozzles:</strong> {nozzles} @ ₹1500</p>
                <p style={{ margin: 0 }}><strong>Addl. Charges:</strong> ₹{numAddAmt.toFixed(2)}</p>
                <div style={{ background: 'var(--bg-body)', padding: '10px', borderRadius: '8px', marginTop: '8px', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontWeight: 800, color: 'var(--success)' }}>GRAND TOTAL: ₹{grandTotal.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <p style={{ margin: '0 0 8px', color: 'var(--primary)', fontWeight: 700 }}>ATTACHMENTS</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Header',  img: pumpHeaderImg },
                    { label: 'Cert',    img: certImg },
                    { label: 'Receipt', img: receiptImg },
                    { label: 'Extra',   img: supportingImg },
                  ].map(({ label, img }) => (
                    <span key={label} style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', background: img ? '#d1fae5' : '#fee2e2', color: img ? '#065f46' : '#991b1b', fontWeight: 600 }}>
                      {img ? '✓' : '✗'} {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={downloadPDF}
              style={{ marginTop: '10px', padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
            >
              <FileCheck2 size={18} /> Confirm &amp; Share
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          RESET CONFIRM MODAL
      ══════════════════════════════ */}
      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface, #ffffff)', width: '90%', maxWidth: '340px', padding: '24px', borderRadius: '16px', animation: 'slideUp 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', color: 'var(--text-main)' }}>Reset Form?</h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Are you sure you want to clear all inputs and uploaded images? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ padding: '10px 16px', borderRadius: '8px', background: 'var(--bg-body)', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeReset} style={{ padding: '10px 16px', borderRadius: '8px', background: '#ef4444', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Reset Everything</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
          CROPPER EDITOR
      ══════════════════════════════ */}
      {editorOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', color: '#fff', alignItems: 'center' }}>
            <button onClick={closeEditor} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={24} /></button>
            <span style={{ fontWeight: 600, letterSpacing: '1px', fontSize: '14px' }}>EDIT PHOTO</span>
            <button onClick={applyCropAndRotation} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>DONE</button>
          </div>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '20px' }}>
            <AdvancedCropper
              ref={cropperRef}
              src={editorSrc}
              className="cropper"
              style={{ height: '100%', width: '100%' }}
              // Header: locked 210:60 ratio. All others: full image, free crop.
              stencilProps={
                editorTarget === 'header'
                  ? { aspectRatio: 210 / 60 }
                  : {}
              }
              defaultCoordinates={
                editorTarget !== 'header'
                  ? ({ imageSize }) => ({
                      left: 0, top: 0,
                      width:  imageSize.width,
                      height: imageSize.height,
                    })
                  : undefined
              }
            />
          </div>
          <div style={{ padding: '30px 30px 40px', background: 'rgba(25,25,25,1)', display: 'flex', justifyContent: 'center', gap: '50px' }}>
            <div onClick={handleRotate} style={{ textAlign: 'center', color: '#fff', cursor: 'pointer' }}>
              <RotateCw size={24} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: '10px', opacity: 0.7, fontWeight: 600, marginTop: '6px' }}>ROTATE</div>
            </div>
            <div style={{ textAlign: 'center', color: '#3b82f6', cursor: 'pointer' }}>
              <Crop size={24} style={{ margin: '0 auto' }} />
              <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '6px' }}>FREE CROP</div>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer" style={{ marginTop: '20px', textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '5px' }}>Made by <strong>Velocity6097</strong></p>
        <p className="special-thanks" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Special thanks to Mr. Baibhav Bishal Sir for this opportunity</p>
      </footer>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .hidden-date-input {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 44px;
          border: none;
          background: transparent;
        }
        /* Hide the native text so only our overlay div shows */
        .hidden-date-input::-webkit-datetime-edit,
        .hidden-date-input::-webkit-datetime-edit-fields-wrapper,
        .hidden-date-input::-webkit-datetime-edit-text,
        .hidden-date-input::-webkit-datetime-edit-month-field,
        .hidden-date-input::-webkit-datetime-edit-day-field,
        .hidden-date-input::-webkit-datetime-edit-year-field {
          color: transparent !important;
          background: transparent !important;
        }
        /* Make the whole input area clickable */
        .hidden-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ReimbursementInvoice;