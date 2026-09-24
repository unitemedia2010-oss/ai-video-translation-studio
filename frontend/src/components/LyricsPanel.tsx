import { memo, useEffect, useRef, useState } from 'react';
import type { LyricLine } from '../types';
import { formatClock, getReviewReasons } from '../utils/lyrics';

interface LyricsPanelProps {
  lines: LyricLine[];
  selectedLineId?: string;
  activeLineId?: string;
  onSelect: (lineId: string) => void;
  onSeek: (time: number) => void;
  onTextChange: (lineId: string, text: string) => void;
  onToggleLock: (lineId: string) => void;
  onAddLine: (afterLineId: string) => void;
  onDeleteLine: (lineId: string) => void;
  onReplaceAllLyrics?: (newText: string) => void;
}

export const LyricsPanel = memo(function LyricsPanel({
  lines,
  selectedLineId,
  activeLineId,
  onSelect,
  onSeek,
  onTextChange,
  onToggleLock,
  onAddLine,
  onDeleteLine,
  onReplaceAllLyrics,
}: LyricsPanelProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceText, setReplaceText] = useState('');

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedLineId]);

  return (
    <section className="studio-panel lyrics-panel" aria-label="Danh sÃ¡ch lá»i bÃ i hÃ¡t">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Báº¢N Lá»œI CHUáº¨N</span>
          <h2>Lá»i bÃ i hÃ¡t</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onReplaceAllLyrics && (
            <button
              type="button"
              className="text-button"
              style={{ fontSize: '0.72rem', padding: '2px 6px', color: 'var(--accent)' }}
              onClick={() => {
                setReplaceText(lines.map((l) => l.text).join('\n'));
                setShowReplaceModal(true);
              }}
              title="DÃ¡n hoáº·c cáº­p nháº­t láº¡i toÃ n bá»™ lá»i bÃ i hÃ¡t"
            >
              ðŸ“ Äá»•i lá»i
            </button>
          )}
          <span className="count-pill">{lines.length} cÃ¢u</span>
        </div>
      </div>
      <div className="lyrics-list">
        {lines.map((line, index) => {
          const selected = line.id === selectedLineId;
          const active = line.id === activeLineId;
          const reasons = getReviewReasons(line);
          return (
            <div
              key={line.id}
              ref={selected ? selectedRef : undefined}
              className={`lyric-card ${selected ? 'selected' : ''} ${active ? 'playing' : ''}`}
              onClick={() => onSelect(line.id)}
            >
              <button
                className="line-time"
                type="button"
                disabled={line.start === null}
                onClick={(event) => { event.stopPropagation(); if (line.start !== null) onSeek(line.start); }}
                aria-label={`Nghe tá»« ${formatClock(line.start, true)}`}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <time>{formatClock(line.start, true)}</time>
              </button>
              <textarea
                rows={2}
                value={line.text}
                readOnly={line.locked}
                onFocus={() => onSelect(line.id)}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => onTextChange(line.id, event.target.value)}
                aria-label={`Ná»™i dung cÃ¢u ${index + 1}`}
              />
              <div className="line-meta">
                {reasons.length > 0 ? (
                  <span className="review-chip" title={reasons.join(' Â· ')}>âš  Cáº§n kiá»ƒm tra</span>
                ) : (
                  <span className="ok-chip">ÄÃ£ cÃ³ nhá»‹p</span>
                )}
                <div style={{ flex: 1 }} />
                <button type="button" className="icon-button tiny" onClick={(event) => { event.stopPropagation(); onAddLine(line.id); }} title="Thêm dòng bên du?i">?</button>
                <button type="button" className="icon-button tiny" onClick={(event) => { event.stopPropagation(); onDeleteLine(line.id); }} title="Xóa dòng này">?</button>
                <button
                  type="button"
                  className={`icon-button tiny ${line.locked ? 'active' : ''}`}
                  onClick={(event) => { event.stopPropagation(); onToggleLock(line.id); }}
                  title={line.locked ? 'Má»Ÿ khÃ³a cÃ¢u' : 'KhÃ³a cÃ¢u Ä‘Ã£ sá»­a'}
                  aria-label={line.locked ? 'Má»Ÿ khÃ³a cÃ¢u' : 'KhÃ³a cÃ¢u'}
                >
                  {line.locked ? 'ðŸ”’' : 'ðŸ”“'}
                </button>
              </div>
            </div>
          );
        })}
        {lines.length === 0 ? <div className="empty-panel">ChÆ°a cÃ³ lá»i. HÃ£y dÃ¡n lyric rá»“i cÄƒn láº¡i toÃ n bÃ i.</div> : null}
      </div>

      {showReplaceModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-amber-500 uppercase">Cáº¬P NHáº¬T Lá»œI BÃ€I HÃT</span>
                <h3 className="text-lg font-bold">DÃ¡n báº£n lá»i chuáº©n má»›i</h3>
              </div>
              <button type="button" onClick={() => setShowReplaceModal(false)} className="text-stone-400 hover:text-white text-xl">âœ•</button>
            </div>
            <p className="text-xs text-stone-400">
              DÃ¡n toÃ n bá»™ lá»i bÃ i hÃ¡t vÃ o Ä‘Ã¢y (má»—i cÃ¢u má»™t dÃ²ng). Nháº¡c vÃ  giá»ng hÃ¡t Ä‘Ã£ Ä‘Æ°á»£c tÃ¡ch sáºµn nÃªn quÃ¡ trÃ¬nh cÄƒn láº¡i lá»i má»›i sáº½ hoÃ n táº¥t chá»‰ trong 1 giÃ¢y!
            </p>
            <textarea
              className="w-full h-64 p-3 bg-stone-950 border border-stone-700 rounded-xl text-sm font-sans text-stone-200 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
              placeholder="DÃ¡n toÃ n bá»™ lá»i bÃ i hÃ¡t táº¡i Ä‘Ã¢y..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-stone-500">
                {replaceText.split(/\r?\n/).filter((l) => l.trim()).length} cÃ¢u Â· {replaceText.trim() ? replaceText.trim().split(/\s+/).length : 0} tiáº¿ng
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplaceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800"
                >
                  Há»§y
                </button>
                <button
                  type="button"
                  disabled={!replaceText.trim()}
                  onClick={() => {
                    onReplaceAllLyrics?.(replaceText.trim());
                    setShowReplaceModal(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-lg disabled:opacity-50 transition-colors"
                >
                  âœ“ CÄƒn nhá»‹p láº¡i ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

