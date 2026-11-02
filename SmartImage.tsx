import { useEffect, useRef, useState } from 'react';
import { ImageOff } from '../lib/icons';

/**
 * Self-healing image component.
 * If the image fails to load (e.g. Supabase Storage is waking from pause),
 * it pings /api/keepalive to trigger a project restore, then retries the
 * image with exponential backoff and a cache-buster. After all retries it
 * shows a branded placeholder instead of a broken-image icon.
 */
interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

const MAX_RETRIES = 3;
let wakeSent = false; // one wake call per page load is enough

function sendWake() {
  if (wakeSent) return;
  wakeSent = true;
  fetch('/api/keepalive').catch(() => {});
  // allow another wake attempt after a minute
  setTimeout(() => {
    wakeSent = false;
  }, 60_000);
}

export default function SmartImage({ src, alt, className, ...rest }: SmartImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when the src prop changes
  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [src]);

  const handleError = () => {
    // Local/relative and blob URLs won't benefit from retries
    const isRemote = /^https?:\/\//.test(src);
    if (!isRemote || attempt >= MAX_RETRIES) {
      setFailed(true);
      return;
    }
    sendWake();
    const delay = 1500 * Math.pow(2, attempt); // 1.5s, 3s, 6s
    timer.current = setTimeout(() => setAttempt((a) => a + 1), delay);
  };

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1.5 bg-paper text-wood/50 ${className ?? ''}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff size={22} />
        <span className="text-[10px] font-bold uppercase tracking-wide">Image loading…</span>
      </div>
    );
  }

  const effectiveSrc =
    attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}r=${attempt}` : src;

  return (
    <img
      key={effectiveSrc}
      src={effectiveSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...rest}
    />
  );
}
