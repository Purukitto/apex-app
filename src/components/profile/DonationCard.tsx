import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Coffee, IndianRupee, X, Copy, Check } from 'lucide-react';
import { itemVariants, buttonHoverProps, cardHoverProps } from '../../lib/animations';
import { DONATION_CONFIG } from '../../config/donation';
import QRCode from 'react-qr-code';
import { apexToast } from '../../lib/toast';

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
    try {
      await Browser.open({
        url: upiUrl,
        windowName: '_self',
      });
    } catch (error) {
      // Fallback: Show modal with QR code if deep link fails
      console.error('Failed to open UPI app:', error);
      setShowUPIModal(true);
    }
  };

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_CONFIG.UPI_VPA);
      setCopied(true);
      apexToast.success('UPI ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy UPI ID:', error);
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
      console.error('Failed to open Buy Me a Coffee:', error);
    }
  };

  return (
    <>
      <motion.div
        className="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-6 border border-apex-white/20"
        variants={itemVariants}
        {...cardHoverProps}
      >
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
      </motion.div>

      {/* UPI Payment Modal (for web and fallback) */}
      <AnimatePresence>
        {showUPIModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUPIModal(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="bg-apex-black border border-apex-white/20 rounded-lg p-6 w-full max-w-md relative z-50"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
              >
                {/* Close Button */}
                <motion.button
                  onClick={() => setShowUPIModal(false)}
                  className="absolute top-4 right-4 p-2 text-apex-white/60 hover:text-apex-white transition-colors"
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
