import { motion } from 'framer-motion';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Coffee, IndianRupee } from 'lucide-react';
import { itemVariants, buttonHoverProps, cardHoverProps } from '../../lib/animations';
import { DONATION_CONFIG } from '../../config/donation';

export default function DonationCard() {
  const handleUPIDonation = async () => {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(DONATION_CONFIG.UPI_VPA)}&pn=${encodeURIComponent(DONATION_CONFIG.PAYEE_NAME)}&tn=${encodeURIComponent(DONATION_CONFIG.NOTE)}&cu=INR`;
    const webFallbackUrl = `https://paytm.com/pay?pa=${encodeURIComponent(DONATION_CONFIG.UPI_VPA)}&pn=${encodeURIComponent(DONATION_CONFIG.PAYEE_NAME)}&tn=${encodeURIComponent(DONATION_CONFIG.NOTE)}&cu=INR`;
    
    try {
      // Try to open UPI deep link
      await Browser.open({
        url: upiUrl,
        windowName: Capacitor.isNativePlatform() ? '_self' : '_blank',
      });
    } catch (error) {
      // Fallback: Open a web-based UPI payment page (e.g., on iOS or if no UPI app is installed)
      console.error('Failed to open UPI app:', error);
      try {
        await Browser.open({
          url: webFallbackUrl,
          windowName: '_blank',
        });
      } catch (fallbackError) {
        console.error('Failed to open fallback UPI page:', fallbackError);
      }
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
  );
}
