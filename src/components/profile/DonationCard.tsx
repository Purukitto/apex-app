import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Coffee, IndianRupee, X, Copy, Check } from 'lucide-react';
import { buttonHoverProps } from '../../lib/animations';
import { DONATION_CONFIG } from '../../config/donation';
import QRCode from 'react-qr-code';
import { apexToast } from '../../lib/toast';
import { logger } from '../../lib/logger';
import { Card } from '../ui/Card';

export default function DonationCard() {
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(DONATION_CONFIG.UPI_VPA)}&pn=${encodeURIComponent(DONATION_CONFIG.PAYEE_NAME)}&tn=${encodeURIComponent(DONATION_CONFIG.NOTE)}&cu=INR`;

  const handleUPIDonation = async () => {
    // On web, show QR code modal instead of trying to open UPI link
    if (!Capacitor.isNativePlatform()) {
      setShowUPIModal(true);
      return;
    }

    // On native platforms, try to open UPI deep link
    // Only show QR modal on explicit errors, not when user cancels
    const platform = Capacitor.getPlatform();
    
    try {
      if (platform === 'android') {
        // On Android, use window.location (more reliable for UPI deep links in webview)
        window.location.href = upiUrl;
        // If this succeeds, the app picker will show
        // If user cancels or selects an app, we don't interfere
      } else {
        // On iOS, use Browser.open (same as Android, but with windowName)
        await Browser.open({ url: upiUrl, windowName: '_blank' });
        // If this succeeds, UPI app should open
      }
      // Don't show modal - let the user choose or cancel naturally
    } catch (error) {
      // Only show QR modal if there's an explicit error
      logger.error('Failed to open UPI app:', error);
      setShowUPIModal(true);
    }
  };

  const handleCopyUPI = async () => {
    const upiId = DONATION_CONFIG.UPI_VPA;
    
    try {
      // Try modern Clipboard API first (works on web and modern mobile webviews)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(upiId);
          setCopied(true);
          apexToast.success('UPI ID copied to clipboard');
          setTimeout(() => setCopied(false), 2000);
          return;
        } catch (clipboardError) {
          // Clipboard API might fail due to permissions or security context
          // Fall through to fallback method
          logger.debug('Clipboard API failed, trying fallback:', clipboardError);
        }
      }
      
      // Fallback: Use execCommand for older browsers, webviews, or when clipboard API fails
      // This works in both web and Capacitor webviews
      const textArea = document.createElement('textarea');
      textArea.value = upiId;
      // Position off-screen but visible to the browser (some webviews need this)
      textArea.style.position = 'fixed';
      textArea.style.left = '0';
      textArea.style.top = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');
      textArea.setAttribute('aria-hidden', 'true');
      
      document.body.appendChild(textArea);
      
      // For mobile webviews, we need to ensure the element is selectable
      if (Capacitor.isNativePlatform()) {
        textArea.contentEditable = 'true';
        textArea.readOnly = false;
      }
      
      // Select the text
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 99999); // For mobile devices
      textArea.focus();
      
      // Execute copy command
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      if (selection) {
        selection.removeAllRanges();
      }
      
      if (successful) {
        setCopied(true);
        apexToast.success('UPI ID copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (error) {
      logger.error('Failed to copy UPI ID:', error);
      apexToast.error('Failed to copy UPI ID');
    }
  };

  const handleBuyMeACoffee = async () => {
    try {
      await Browser.open({
        url: DONATION_CONFIG.BMC_LINK,
        windowName: '_blank',
      });
    } catch (error) {
      logger.error('Failed to open Buy Me a Coffee:', error);
    }
  };

  return (
    <>
      <Card padding="md" animate="item">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-apex-green/10">
            <Coffee size={20} className="text-apex-green" />
          </div>
          <h2 className="text-lg font-semibold text-apex-white">Support Apex</h2>
        </div>
        
        <p className="text-sm text-apex-white/60 mb-6">
          This project is free and open-source. If you like it, consider buying me a coffee or a tank of gas!
        </p>

        <div className="space-y-3">
          {/* UPI Donation Button */}
          <motion.button
            onClick={handleUPIDonation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-white transition-colors"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #1E88E5 100%)',
            }}
            {...buttonHoverProps}
          >
            <IndianRupee size={18} />
            Donate via UPI (₹)
          </motion.button>

          {/* Buy Me a Coffee Button */}
          <motion.button
            onClick={handleBuyMeACoffee}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-apex-black transition-colors"
            style={{
              backgroundColor: '#FFDD00',
            }}
            {...buttonHoverProps}
          >
            <Coffee size={18} />
            Buy me a Coffee ($)
          </motion.button>
        </div>
      </Card>

      {/* UPI Payment Modal (for web and fallback) */}
      <AnimatePresence>
        {showUPIModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-[100]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUPIModal(false)}
            />

            {/* Modal */}
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
              onClick={() => setShowUPIModal(false)}
            >
              <motion.div
                className="bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md relative z-[100] pointer-events-auto"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <motion.button
                  onClick={() => setShowUPIModal(false)}
                  className="absolute top-4 right-4 p-2 text-apex-white/60 hover:text-apex-white transition-colors z-10"
                  aria-label="Close"
                  {...buttonHoverProps}
                >
                  <X size={20} />
                </motion.button>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-apex-white mb-2">
                    Donate via UPI
                  </h3>
                  <p className="text-sm text-apex-white/60 mb-6">
                    Scan the QR code with any UPI app or use the UPI ID below
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center mb-6 p-4 bg-white rounded-lg">
                    <QRCode
                      value={upiUrl}
                      size={200}
                      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                      viewBox="0 0 200 200"
                    />
                  </div>

                  {/* UPI ID */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-2">
                        UPI ID
                      </p>
                      <div className="flex items-center gap-2 justify-center">
                        <p className="text-apex-white font-mono text-lg">
                          {DONATION_CONFIG.UPI_VPA}
                        </p>
                        <motion.button
                          onClick={handleCopyUPI}
                          className="p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                          {...buttonHoverProps}
                          aria-label="Copy UPI ID"
                        >
                          {copied ? (
                            <Check size={18} className="text-apex-green" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-apex-white/60 uppercase tracking-wide mb-2">
                        Payee Name
                      </p>
                      <p className="text-apex-white font-mono">
                        {DONATION_CONFIG.PAYEE_NAME}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
