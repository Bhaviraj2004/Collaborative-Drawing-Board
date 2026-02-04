import type { Cursor } from '../types/drawing.types';
interface CursorOverlayProps {
  cursors: Record<string, Cursor>;
}

export default function CursorOverlay({ cursors }: CursorOverlayProps) {
  console.log('🖱️ CursorOverlay rendering with cursors:', cursors);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            transform: 'translate(-12px, -12px)', // Center the cursor tip
            willChange: 'transform', // Smooth GPU acceleration
          }}
        >
          {/* Modern Cursor Pointer (Refined SVG) */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
          >
            {/* Outer glow / subtle border */}
            <path
              d="M8 4L8 24L13 19L17 28L20 26L15 17L25 17L8 4Z"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinejoin="round"
              opacity="0.4"
            />
            {/* Main filled shape */}
            <path
              d="M8 4L8 24L13 19L17 28L20 26L15 17L25 17L8 4Z"
              fill={cursor.color}
              stroke="white"
              strokeWidth="2.5"
              strokeLinejoin="round"
              className="transition-all duration-150"
            />
          </svg>

          {/* Username Label - Modern pill with blur & glow */}
          <div
            className={`
              absolute top-5 left-5 
              px-3 py-1.5 rounded-full text-xs font-semibold 
              text-white whitespace-nowrap 
              shadow-lg backdrop-blur-md 
              border border-white/40
              transition-all duration-200 opacity-90 hover:opacity-100
              pointer-events-none
            `}
            style={{
              backgroundColor: `${cursor.color}cc`, // ~80% opacity
              boxShadow: `0 4px 12px ${cursor.color}4d`, // subtle glow
              transform: 'translateX(-20%)', // slight offset for better positioning
            }}
          >
            {cursor.username}
          </div>
        </div>
      ))}
    </div>
  );
}