import { ArrowLeft, Loader2 } from 'lucide-react';

function BookSticker() {
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 drop-shadow-md" aria-hidden="true">
      <circle cx="36" cy="36" r="32" fill="#f6c945" />
      <path
        d="M24 22h16.5a6 6 0 0 1 6 6v22H30a6 6 0 0 0-6 6V22z"
        fill="#fff"
        stroke="#1a1a1a"
        strokeWidth="2"
      />
      <path d="M30 28h12M30 33h10" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="50" cy="50" r="8" fill="#fff" stroke="#1a1a1a" strokeWidth="1.6" />
      <path
        d="M47 50.2 49.2 52.4 53.5 48"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckSticker() {
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 drop-shadow-md" aria-hidden="true">
      <path
        d="M58 14l2 3 3 .4-2.2 2.2.6 3.2L58 21l-3.4 1.8.6-3.2-2.2-2.2 3-.4L58 14z"
        fill="#7c5cbf"
      />
      <path
        d="M18 18l1.2 2 2 .2-1.5 1.4.4 2L18 22.6 16 23.6l.4-2-1.5-1.4 2-.2L18 18z"
        fill="#7c5cbf"
      />
      <circle cx="36" cy="40" r="18" fill="#7c5cbf" />
      <path
        d="M28 40.5 33.2 46 45 33"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BulbSticker() {
  return (
    <svg viewBox="0 0 72 72" className="h-[68px] w-[68px] drop-shadow-md" aria-hidden="true">
      <circle cx="36" cy="36" r="30" fill="#f08a24" />
      <path
        d="M36 18a12 12 0 0 0-7 21.8V44h14v-4.2A12 12 0 0 0 36 18z"
        fill="#fff"
        stroke="#1a1a1a"
        strokeWidth="2"
      />
      <path d="M31 48h10M32.5 52h7" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Wide admin form board with floating stickers (landing-demo style).
 */
const AdminFormFrame = ({ title, onBack, loading = false, children }) => (
  <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
    <div className="relative w-full max-w-6xl">
      <div
        className="float-sticker pointer-events-none absolute -left-8 -top-8 z-10 hidden lg:block"
        style={{ '--tilt': '-12deg' }}
      >
        <BookSticker />
      </div>
      <div
        className="float-sticker pointer-events-none absolute -right-6 -top-7 z-10 hidden lg:block"
        style={{ '--tilt': '8deg', animationDelay: '0.6s' }}
      >
        <CheckSticker />
      </div>
      <div
        className="float-sticker pointer-events-none absolute -left-16 top-[42%] z-10 hidden lg:block"
        style={{ '--tilt': '-6deg', animationDelay: '1.1s' }}
      >
        <img
          src="/notion/pile-1.webp"
          alt=""
          className="h-14 w-14 rounded-full bg-white shadow-md"
        />
      </div>
      <div
        className="float-sticker pointer-events-none absolute -right-8 -bottom-4 z-10 hidden lg:block"
        style={{ '--tilt': '10deg', animationDelay: '0.3s' }}
      >
        <BulbSticker />
      </div>

      <div className="n-card p-6 sm:p-8 lg:p-10">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" onClick={onBack} className="n-btn-ghost p-2">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-notion-muted" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  </div>
);

export default AdminFormFrame;
