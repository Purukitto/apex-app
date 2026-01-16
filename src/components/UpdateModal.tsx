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
  // Combines sections from multiple versions into a single organized changelog
  const formatReleaseNotes = (notes: string): string => {
    if (!notes) return 'No release notes available.';
    
    // Only keep Features, Bug Fixes, Styles, Performance, and Security sections
    const allowedSections = ['Features', 'Bug Fixes', 'Styles', 'Performance', 'Security'];
    const lines = notes.split('\n');
    
    // Track versions and their sections
    interface SectionItem {
      content: string;
      version?: string;
    }
    
    const sections: Record<string, SectionItem[]> = {};
    let currentSection: string | null = null;
    let currentVersion: string | null = null;
    let currentSectionItems: string[] = [];
    let insideVersion = false;
    
    // First pass: collect all items by section type
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a version header (## [0.14.0] for major or ### [0.14.5] for minor/patch)
      const versionMatch = line.match(/^(##|###)\s+\[([0-9]+\.[0-9]+\.[0-9]+)\]/);
      if (versionMatch) {
        // Save previous section if we were collecting
        if (currentSection && currentSectionItems.length > 0) {
          if (!sections[currentSection]) {
            sections[currentSection] = [];
          }
          sections[currentSection].push({
            content: currentSectionItems.join('\n'),
            version: currentVersion || undefined,
          });
          currentSectionItems = [];
        }
        
        currentVersion = versionMatch[2];
        currentSection = null;
        insideVersion = true;
        continue;
      }
      
      // Check if this is a section header (### Section Name)
      // Only match if it's not a version header (which also starts with ###)
      const sectionMatch = line.match(/^###\s+(.+?)\s*$/);
      if (sectionMatch && insideVersion) {
        // Save previous section if we were collecting
        if (currentSection && currentSectionItems.length > 0) {
          if (!sections[currentSection]) {
            sections[currentSection] = [];
          }
          sections[currentSection].push({
            content: currentSectionItems.join('\n'),
            version: currentVersion || undefined,
          });
          currentSectionItems = [];
        }
        
        const sectionName = sectionMatch[1].trim();
        // Check if this section should be included
        const isAllowed = allowedSections.some(
          allowed => sectionName.toLowerCase() === allowed.toLowerCase()
        );
        
        if (isAllowed) {
          currentSection = sectionName;
        } else {
          currentSection = null;
        }
        continue;
      }
      
      // Collect content for current section
      if (currentSection && line.trim() && insideVersion) {
        currentSectionItems.push(line);
      }
    }
    
    // Save last section if we were collecting
    if (currentSection && currentSectionItems.length > 0) {
      if (!sections[currentSection]) {
        sections[currentSection] = [];
      }
      sections[currentSection].push({
        content: currentSectionItems.join('\n'),
        version: currentVersion || undefined,
      });
    }
    
    // Second pass: combine sections and format
    const output: string[] = [];
    
    // Output sections in preferred order
    for (const sectionName of allowedSections) {
      if (sections[sectionName] && sections[sectionName].length > 0) {
        output.push(`### ${sectionName}`);
        output.push('');
        
        // Combine all items from this section across all versions
        const allItems: string[] = [];
        for (const item of sections[sectionName]) {
          const items = item.content
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
              // Keep list items (starting with *) and non-empty lines that look like content
              return line.length > 0 && (line.startsWith('*') || line.startsWith('-'));
            });
          
          allItems.push(...items);
        }
        
        // Remove duplicates (same commit message) while preserving order
        const seen = new Set<string>();
        const uniqueItems: string[] = [];
        for (const item of allItems) {
          // Normalize item for comparison (remove commit hashes, links, etc.)
          const normalized = item
            .replace(/\(\[[a-f0-9]{7,}\]\)/gi, '')
            .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
            .replace(/https?:\/\/github\.com\/[^\s)]+/gi, '')
            .replace(/\s+\([a-f0-9]{7,}\)\s*$/, '')
            .trim();
          
          if (normalized && !seen.has(normalized)) {
            seen.add(normalized);
            uniqueItems.push(item);
          }
        }
        
        output.push(...uniqueItems);
        output.push('');
      }
    }
    
    const combined = output.join('\n');
    
    // Clean up formatting - preserve section headers (### Section Name) and list markers (*)
    return combined
      .split('\n')
      .map(line => {
        // Clean up markdown formatting
        let cleaned = line
          // Remove bold markdown
          .replace(/\*\*(.*?)\*\*/g, '$1')
          // Remove italic markdown (careful not to break list markers)
          // Match *text* but not * at start of line (list marker)
          .replace(/([^*])\*([^*\n]+?)\*([^*])/g, '$1$2$3')
          // Remove GitHub commit links
          .replace(/\(\[[a-f0-9]{7,}\]\)/gi, '')
          // Remove GitHub URLs
          .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
          .replace(/https?:\/\/github\.com\/[^\s)]+/gi, '')
          // Remove commit hash references at end
          .replace(/\s+\([a-f0-9]{7,}\)\s*$/, '')
          // Clean up multiple spaces
          .replace(/[ \t]{2,}/g, ' ');
        
        // Trim lines that aren't section headers (preserve ### headers)
        if (!cleaned.match(/^###\s+/)) {
          cleaned = cleaned.trim();
        }
        
        return cleaned;
      })
      .filter(line => line.length > 0)
      .join('\n')
      // Clean up multiple newlines (keep max 2)
      .replace(/\n{3,}/g, '\n\n')
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
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              padding: '1rem',
              paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
              paddingBottom: `calc(6rem + env(safe-area-inset-bottom, 0px))`,
              paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
            }}
          >
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
