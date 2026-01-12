import { X, Download, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverProps } from '../lib/animations';
import type { UpdateInfo } from '../hooks/useAppUpdate';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  updateInfo: UpdateInfo;
}

export default function UpdateModal({
  isOpen,
  onClose,
  onDownload,
  updateInfo,
}: UpdateModalProps) {
  if (!isOpen) return null;

  // Parse release notes (markdown-like formatting)
  const formatReleaseNotes = (notes: string): string => {
    if (!notes) return 'No release notes available.';
    
    // Remove "Miscellaneous Chores" section (case-insensitive, handles variations)
    // Split by sections and filter out Miscellaneous Chores
    const lines = notes.split('\n');
    const filteredLines: string[] = [];
    let skipSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if this is a Miscellaneous Chores header
      if (/^###\s+Misc(ellaneous)?\s+Chores\s*$/i.test(line)) {
        skipSection = true;
        continue;
      }
      // Check if we hit a new section header (stop skipping)
      if (/^###\s+/.test(line) || /^##\s+/.test(line)) {
        skipSection = false;
      }
      // Only add line if we're not skipping
      if (!skipSection) {
        filteredLines.push(line);
      }
    }
    
    const cleaned = filteredLines.join('\n');
    
    return cleaned
      // Remove markdown headers
      .replace(/^###\s+/gm, '')
      .replace(/^##\s+/gm, '')
      .replace(/^#\s+/gm, '')
      // Remove bold/italic markdown
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove GitHub commit links like ([f76949b]) or ([3ddecd5])
      .replace(/\(\[[a-f0-9]{7,}\]\)/gi, '')
      // Remove full GitHub URLs (both markdown links and plain URLs)
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1') // Markdown links [text](url)
      .replace(/https?:\/\/github\.com\/[^\s)]+/gi, '') // Plain GitHub URLs
      // Remove commit hash references at end of lines
      .replace(/\s+\([a-f0-9]{7,}\)\s*$/gm, '')
      // Clean up multiple spaces
      .replace(/\s{2,}/g, ' ')
      // Clean up multiple newlines (keep max 2)
      .replace(/\n{3,}/g, '\n\n')
      // Trim each line
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      .trim();
  };

  const formattedNotes = formatReleaseNotes(updateInfo.releaseNotes);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pb-24">
            <motion.div
              className="bg-apex-black border border-apex-green/40 rounded-lg p-6 w-full max-w-lg relative z-[100] max-h-[85vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Close Button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                aria-label="Close"
                {...buttonHoverProps}
              >
                <X size={20} />
              </motion.button>

              {/* Header */}
              <div className="flex items-start gap-4 mb-6 pr-8">
                <div className="p-2 rounded-lg bg-apex-green/10 shrink-0">
                  <Sparkles size={24} className="text-apex-green" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-apex-white mb-2">
                    Update Available
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-apex-white/60">Current:</span>
                    <span className="font-mono text-apex-white/80">{updateInfo.currentVersion}</span>
                    <span className="text-apex-white/40">→</span>
                    <span className="text-apex-white/60">Latest:</span>
                    <span className="font-mono text-apex-green">{updateInfo.latestVersion}</span>
                  </div>
                </div>
              </div>

              {/* Release Notes */}
              <div className="flex-1 overflow-y-auto mb-6 min-h-0">
                <div className="bg-apex-white/5 rounded-lg p-4 border border-apex-white/10">
                  <h4 className="text-sm font-semibold text-apex-white mb-3 uppercase tracking-wide">
                    What's New
                  </h4>
                  <div className="text-sm text-apex-white/80 whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">
                    {formattedNotes || 'No release notes available.'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto pt-4 border-t border-apex-white/10">
                <motion.button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-apex-white/60 hover:text-apex-white border border-apex-white/10 hover:border-apex-white/20 rounded-lg transition-colors"
                  {...buttonHoverProps}
                >
                  Later
                </motion.button>
                <motion.button
                  onClick={onDownload}
                  className="flex-1 px-4 py-2.5 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 bg-apex-green text-apex-black hover:bg-apex-green/90"
                  {...buttonHoverProps}
                >
                  {updateInfo.downloadUrl ? (
                    <>
                      <Download size={18} />
                      Download
                    </>
                  ) : (
                    <>
                      <ExternalLink size={18} />
                      View Release
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
