import React, { useState, useEffect, useRef } from "react";
import { apiRequest } from "../lib/api";
import "./BarcodeScannerModal.css";

// Synthesizes a barcode scanner "BEEP" sound using Web Audio API
function playScanBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch 1760Hz
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    // Audio context not allowed without interaction or not supported
  }
}

export default function BarcodeScannerModal({ isOpen, onClose, onSelectMedicine }) {
  const [mode, setMode] = useState("manual"); // 'camera' or 'manual'
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanResult(null);
      setErrorMsg("");
      setBarcodeInput("");
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setErrorMsg("");
      setMode("camera");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setErrorMsg("Camera access not available or permission denied. Please use manual or USB scanner input.");
      setMode("manual");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleScanCode = async (codeToSearch) => {
    const targetCode = (codeToSearch || barcodeInput).trim();
    if (!targetCode) {
      setErrorMsg("Please enter or scan a barcode or batch number");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setScanResult(null);

    try {
      const data = await apiRequest(`/api/medicines/scan?code=${encodeURIComponent(targetCode)}`);
      if (data && data.found) {
        playScanBeep();
        setScanResult(data);
        if (onSelectMedicine) {
          onSelectMedicine(data);
        }
      } else {
        setErrorMsg(data.message || `No medicine or batch found matching "${targetCode}"`);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to query barcode scanner service");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleScanCode();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="scanner-modal-overlay" onClick={onClose}>
      <div className="scanner-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="scanner-modal-header">
          <div className="scanner-modal-title">
            <span className="scanner-icon">📷</span>
            <h3>Barcode & QR Medicine Scanner</h3>
          </div>
          <button className="scanner-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="scanner-tabs">
          <button
            className={`scanner-tab-btn ${mode === "manual" ? "active" : ""}`}
            onClick={() => { stopCamera(); setMode("manual"); }}
          >
            ⌨️ Manual / USB Laser Scanner
          </button>
          <button
            className={`scanner-tab-btn ${mode === "camera" ? "active" : ""}`}
            onClick={startCamera}
          >
            📹 Live Video Camera
          </button>
        </div>

        <div className="scanner-modal-body">
          {mode === "camera" ? (
            <div className="camera-viewfinder-container">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video-feed" />
              <div className="scanner-target-reticle">
                <div className="reticle-line" />
              </div>
              <p className="scanner-hint">Align barcode or QR code inside the target window.</p>
              <div className="camera-quick-input">
                <input
                  type="text"
                  placeholder="Or enter detected code..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button onClick={() => handleScanCode()} disabled={loading}>
                  {loading ? "Scanning..." : "Lookup"}
                </button>
              </div>
            </div>
          ) : (
            <div className="manual-scan-container">
              <p className="scanner-desc">
                Point any standard USB/Bluetooth handheld barcode scanner at the package, or type the Batch / Medicine ID below:
              </p>
              <div className="scanner-input-group">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. BATCH-2026-001, PARA-500, or 1"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="scanner-submit-btn"
                  onClick={() => handleScanCode()}
                  disabled={loading}
                >
                  {loading ? "Scanning..." : "🔍 Scan"}
                </button>
              </div>

              <div className="scanner-quick-presets">
                <span className="preset-label">Quick Test Presets:</span>
                <button onClick={() => { setBarcodeInput("BATCH-2026-001"); handleScanCode("BATCH-2026-001"); }}>
                  BATCH-2026-001
                </button>
                <button onClick={() => { setBarcodeInput("Paracetamol"); handleScanCode("Paracetamol"); }}>
                  Paracetamol
                </button>
                <button onClick={() => { setBarcodeInput("Amoxicillin"); handleScanCode("Amoxicillin"); }}>
                  Amoxicillin
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="scanner-error-banner">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}

          {scanResult && (
            <div className="scanner-result-card">
              <div className="result-header">
                <span className="badge-match">✔ MATCH FOUND ({scanResult.matchType})</span>
                <span className="badge-cat">{scanResult.category || "General"}</span>
              </div>

              <h4 className="result-medicine-name">{scanResult.medicineName}</h4>
              <p className="result-generic">{scanResult.genericName} • {scanResult.dosage} • {scanResult.unit}</p>

              <div className="result-grid">
                <div className="grid-item">
                  <span className="item-label">Batch Number</span>
                  <span className="item-val highlight">{scanResult.batchNumber || "Multiple Batches"}</span>
                </div>
                <div className="grid-item">
                  <span className="item-label">Available Stock</span>
                  <span className="item-val">{scanResult.availableQuantity ?? scanResult.totalStock ?? scanResult.quantity} units</span>
                </div>
                <div className="grid-item">
                  <span className="item-label">Unit Price</span>
                  <span className="item-val">₹{scanResult.price}</span>
                </div>
                <div className="grid-item">
                  <span className="item-label">Storage Location</span>
                  <span className="item-val">{scanResult.location || "Shelf A-1"}</span>
                </div>
              </div>

              {scanResult.expiryDate && (
                <div className={`expiry-status-box ${scanResult.isExpired ? "expired" : scanResult.isNearExpiry ? "warning" : "good"}`}>
                  <span>
                    {scanResult.isExpired
                      ? `🚨 EXPIRED on ${scanResult.expiryDate}`
                      : scanResult.isNearExpiry
                      ? `⚠️ EXPIRING SOON: ${scanResult.daysUntilExpiry} days left (${scanResult.expiryDate})`
                      : `✅ Shelf-life Valid: ${scanResult.daysUntilExpiry} days left (${scanResult.expiryDate})`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="scanner-modal-footer">
          <button className="scanner-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
