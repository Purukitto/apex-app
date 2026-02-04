import { type ReactElement, useEffect } from 'react';
import { X, Download, ExternalLink, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonHoverProps, fastItemVariants, listContainerVariants } from '../lib/animations';
import type { UpdateInfo } from '../hooks/useAppUpdate';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDeleteApk: () => void;
  updateInfo: UpdateInfo;
  downloadState: 'idle' | 'downloading' | 'installing';
  downloadProgress: number;
  canDirectDownload: boolean;
  hasDownloadedApk: boolean;
}

export default function UpdateModal({
  isOpen,
  onClose,
  onDownload,
  onDeleteApk,
  updateInfo,
  downloadState,
  downloadProgress,
  canDirectDownload,
  hasDownloadedApk,
}: UpdateModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore original overflow when modal closes or component unmounts
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const isDownloading = downloadState === 'downloading';
  const isInstalling = downloadState === 'installing';
  const isBusy = isDownloading || isInstalling;
  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  // Clean a single line of markdown (links, hashes, etc.) for display
  const cleanLine = (line: string): string =>
    line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/([^*])\*([^*\n]+?)\*([^*])/g, '$1$2$3')
      .replace(/\(\[[a-f0-9]{7,}\]\([^)]+\)\)/gi, '')
      .replace(/\(\[[a-f0-9]{7,}\]\)/gi, '')
      .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
      .replace(/https?:\/\/github\.com\/[^\s)]+/gi, '')
      .replace(/\s+\([a-f0-9]{7,}\)\s*$/, '')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();

  // Parse release notes: preserve version segments (## vX.Y.Z) and allowed sections per version.
  // Supports combined notes from multiple releases (newest first), like release.yml changelog style.
  const formatReleaseNotes = (notes: string): string => {
    if (!notes) return 'No release notes available.';

    const allowedSections = ['Features', 'Bug Fixes', 'Styles', 'Performance', 'Security'];
    const lines = notes.split('\n');

    // Match version headers: ## v1.7.0 or ## [1.7.0] or ### [1.7.0]
    const versionHeaderRe = /^(##|###)\s+(?:v?([0-9]+\.[0-9]+\.[0-9]+)|\[([0-9]+\.[0-9]+\.[0-9]+)\])/;
    const sectionHeaderRe = /^###\s+(.+?)\s*$/;

    type VersionBlock = { version: string; sections: Array<{ name: string; items: string[] }> };
    const versionBlocks: VersionBlock[] = [];
    let currentBlock: VersionBlock | null = null;
    let currentSection: string | null = null;
    let currentItems: string[] = [];

    const flushSection = () => {
      if (currentBlock && currentSection && currentItems.length > 0) {
        const existing = currentBlock.sections.find((s) => s.name === currentSection!);
        if (existing) {
          existing.items.push(...currentItems);
        } else {
          currentBlock.sections.push({ name: currentSection!, items: [...currentItems] });
        }
        currentItems = [];
      }
      currentSection = null;
    };

    const flushVersion = () => {
      flushSection();
      if (currentBlock && currentBlock.sections.length > 0) {
        versionBlocks.push(currentBlock);
      }
      currentBlock = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const versionMatch = line.match(versionHeaderRe);
      if (versionMatch) {
        flushVersion();
        const version = versionMatch[2] || versionMatch[3] || '';
        currentBlock = { version, sections: [] };
        continue;
      }

      const sectionMatch = line.match(sectionHeaderRe);
      if (sectionMatch && currentBlock) {
        flushSection();
        const name = sectionMatch[1].trim();
        const isAllowed = allowedSections.some((a) => a.toLowerCase() === name.toLowerCase());
        if (isAllowed) {
          currentSection = name;
        }
        continue;
      }

      if (currentBlock && currentSection && line.trim() && (line.startsWith('*') || line.startsWith('-'))) {
        const cleaned = cleanLine(line).replace(/^[*\-+]\s+/, '').trim();
        if (cleaned) currentItems.push(cleaned);
      }
    }
    flushVersion();

    // Build output: ## vX.Y.Z then ### Section then items, per version
    const output: string[] = [];
    for (const block of versionBlocks) {
      output.push(`## v${block.version}`);
      output.push('');
      for (const sectionName of allowedSections) {
        const section = block.sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
        if (section && section.items.length > 0) {
          const seen = new Set<string>();
          const unique = section.items.filter((item) => {
            const n = item.trim();
            if (!n || seen.has(n)) return false;
            seen.add(n);
            return true;
          });
          output.push(`### ${sectionName}`);
          output.push('');
          for (const item of unique) {
            output.push(`* ${item.trim()}`);
          }
          output.push('');
        }
      }
    }

    return output
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() || 'No release notes available.';
  };

  const formattedNotes = formatReleaseNotes(updateInfo.releaseNotes);

  // Parse formatted notes and render as JSX
  const renderReleaseNotes = (notes: string, releaseUrl?: string | null) => {
    if (!notes || notes === 'No release notes available.') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-apex-white/60 italic">No release notes available for this version.</p>
          {releaseUrl && (
            <a
              href={releaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-apex-green hover:underline inline-block"
            >
              View release on GitHub
            </a>
          )}
        </div>
      );
    }

    const lines = notes.split('\n');
    const elements: ReactElement[] = [];
    let currentListItems: string[] = [];
    let listKey = 0;

    const flushList = () => {
      if (currentListItems.length > 0) {
        elements.push(
          <motion.ul
            key={`list-${listKey++}`}
            variants={fastItemVariants}
            className="space-y-2 mb-4 last:mb-0 list-none pl-0"
          >
            {currentListItems.map((item, idx) => {
              let cleanText = item.replace(/^[*\-+]\s+/, '').trim();
              if (cleanText.length > 0) {
                cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
              }
              return (
                <motion.li
                  key={idx}
                  variants={fastItemVariants}
                  className="flex items-start gap-2 text-sm text-apex-white/80 leading-relaxed"
                >
                  <span className="text-apex-green shrink-0 w-4 flex justify-center pt-0.5" aria-hidden>
                    •
                  </span>
                  <span className="flex-1 min-w-0 wrap-break-word">{cleanText}</span>
                </motion.li>
              );
            })}
          </motion.ul>
        );
        currentListItems = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Version header (## vX.Y.Z) - segment divider
      if (trimmed.match(/^##\s+/)) {
        flushList();
        const versionLabel = trimmed.replace(/^##\s+/, '').trim();
        const isFirst = elements.length === 0;
        elements.push(
          <motion.h4
            key={`version-${idx}`}
            variants={fastItemVariants}
            className={`text-base font-semibold text-apex-green border-b border-apex-white/10 pb-2 mb-3 ${isFirst ? 'mt-0' : 'mt-6'}`}
          >
            {versionLabel}
          </motion.h4>
        );
      }
      // Section header (### Section Name)
      else if (trimmed.match(/^###\s+[^#]/)) {
        flushList();
        const sectionName = trimmed.replace(/^###\s+/, '').trim();
        elements.push(
          <motion.h5
            key={`section-${idx}`}
            variants={fastItemVariants}
            className="text-sm font-semibold text-apex-white/90 mb-2 mt-2"
          >
            {sectionName}
          </motion.h5>
        );
      }
      // List item (* or - or +)
      else if (trimmed.match(/^[*\-+]\s+/)) {
        currentListItems.push(trimmed);
      }
      // Empty line
      else if (!trimmed) {
        flushList();
      }
      // Regular text
      else if (trimmed) {
        flushList();
        elements.push(
          <motion.p
            key={`text-${idx}`}
            variants={fastItemVariants}
            className="text-sm text-apex-white/80 mb-2 wrap-break-word"
          >
            {trimmed}
          </motion.p>
        );
      }
    });

    flushList(); // Flush any remaining list items

    return (
      <motion.div
        variants={listContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1"
      >
        {elements.length > 0 ? elements : (
          <div className="space-y-2">
            <p className="text-sm text-apex-white/60 italic">No release notes available for this version.</p>
            {releaseUrl && (
              <a
                href={releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-apex-green hover:underline inline-block"
              >
                View release on GitHub
              </a>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-apex-black/80 backdrop-blur-sm z-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <div 
            className="fixed inset-0 z-100 flex items-center justify-center overflow-hidden"
            style={{
              padding: '1rem',
              paddingTop: `calc(2.25rem + env(safe-area-inset-top, 0px))`,
              paddingBottom: `calc(3rem + env(safe-area-inset-bottom, 0px))`,
              paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
            }}
          >
            <motion.div
              className="bg-apex-black border border-apex-green/40 rounded-lg p-6 w-full max-w-xl sm:max-w-2xl relative z-100 max-h-[82vh] flex flex-col overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Close Button */}
              <motion.button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-apex-white/60 hover:text-apex-white transition-colors"
                aria-label="Close"
                {...buttonHoverProps}
                disabled={isBusy}
              >
                <X size={20} />
              </motion.button>

              {/* Header */}
              <div className="flex items-start gap-4 mb-6 pr-8">
                <div className="p-2 rounded-lg bg-apex-green/10 shrink-0">
                  <Rocket size={24} className="text-apex-green" />
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
              <div className="flex-1 overflow-y-auto mb-6 min-h-0 overscroll-contain pr-1">
                <div className="bg-linear-to-br from-white/5 to-transparent rounded-md p-4 border border-apex-white/10">
                  <h4 className="text-sm font-semibold text-apex-white mb-4 uppercase tracking-wide">
                    What's New
                  </h4>
                  {renderReleaseNotes(formattedNotes, updateInfo.releaseUrl)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto pt-4 border-t border-apex-white/10">
                <motion.button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 text-apex-white/60 hover:text-apex-white border border-apex-white/10 hover:border-apex-white/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:text-apex-white/60"
                  {...buttonHoverProps}
                  disabled={isBusy}
                >
                  Later
                </motion.button>
                {isBusy ? (
                  <div className="flex-1 px-4 py-2.5 rounded-lg border border-apex-white/10 bg-apex-black/80">
                    <div className="flex items-center justify-between text-xs text-apex-white/70 mb-2">
                      <span>{isInstalling ? 'Opening installer...' : 'Downloading update...'}</span>
                      {!isInstalling && (
                        <span className="font-mono text-apex-white/80">{downloadProgress}%</span>
                      )}
                    </div>
                    {!isInstalling && (
                      <div className="h-2 rounded-full bg-apex-white/10 overflow-hidden">
                        <div
                          className="h-full bg-apex-green transition-[width] duration-200"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.button
                    onClick={onDownload}
                    className="flex-2 px-4 py-2.5 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 bg-apex-green text-apex-black hover:bg-apex-green/90"
                    {...buttonHoverProps}
                  >
                    {canDirectDownload ? (
                      <>
                        <Download size={18} />
                        {hasDownloadedApk ? 'Install' : 'Download'}
                      </>
                    ) : (
                      <>
                        <ExternalLink size={18} />
                        View Release
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              {canDirectDownload && (
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-apex-white/50">
                  <span>
                    If the installer does not appear, enable &quot;Install unknown apps&quot; for Apex in Android settings.
                  </span>
                  {hasDownloadedApk && (
                    <motion.button
                      onClick={onDeleteApk}
                      className="shrink-0 text-[11px] text-apex-red/70 hover:text-apex-red underline underline-offset-4"
                      {...buttonHoverProps}
                    >
                      Delete Downloaded APK
                    </motion.button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
