"use client";
import { useEffect, useRef, useState } from "react";

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface DestructButtonProps {
  timeRemaining: number | null;
  onDestroy: () => void;
}

export function DestructButton({
  timeRemaining,
  onDestroy,
}: DestructButtonProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      handleDestroy();
    }, 2000);
  };

  const cancelHold = () => {
    setIsHolding(false);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  };

  const handleDestroy = () => {
    cancelHold();
    onDestroy();
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  return (
    <button
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        cancelHold();
      }}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
      className="relative flex h-10 items-center gap-2 rounded-full bg-neutral-800 px-8 font-medium text-neutral-300 select-none transition-transform cursor-pointer min-w-[180px] justify-center"
      style={{
        transform: isHolding ? "scale(0.97)" : "scale(1)",
      }}
    >
      {/* red overlay - only clips when holding */}
      <div
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-red-900 text-red-400"
        style={{
          clipPath: isHolding
            ? "inset(0px 0px 0px 0px)"
            : "inset(0px 100% 0px 0px)",
          transition: isHolding
            ? "clip-path 2s linear"
            : "clip-path 200ms ease-out",
        }}
      >
        Destroying
      </div>

      {/* default content */}
      <svg
        height="16"
        strokeLinejoin="round"
        viewBox="0 0 16 16"
        width="16"
        fill="currentColor"
        className="transition-opacity"
        style={{ opacity: isHovering && !isHolding ? 0 : 1 }}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z"
        />
      </svg>

      <span
        className="transition-opacity"
        style={{ opacity: isHovering && !isHolding ? 0 : 1 }}
      >
        <span
          className={
            timeRemaining !== null && timeRemaining < 60
              ? "text-red-400"
              : "text-amber-400"
          }
        >
          {timeRemaining !== null
            ? formatTimeRemaining(timeRemaining)
            : "--:--"}
        </span>
      </span>

      {/* hover text */}
      {isHovering && !isHolding && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-red-400 whitespace-nowrap">
          <svg
            height="16"
            strokeLinejoin="round"
            viewBox="0 0 16 16"
            width="16"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.75 2.75C6.75 2.05964 7.30964 1.5 8 1.5C8.69036 1.5 9.25 2.05964 9.25 2.75V3H6.75V2.75ZM5.25 3V2.75C5.25 1.23122 6.48122 0 8 0C9.51878 0 10.75 1.23122 10.75 2.75V3H12.9201H14.25H15V4.5H14.25H13.8846L13.1776 13.6917C13.0774 14.9942 11.9913 16 10.6849 16H5.31508C4.00874 16 2.92263 14.9942 2.82244 13.6917L2.11538 4.5H1.75H1V3H1.75H3.07988H5.25ZM4.31802 13.5767L3.61982 4.5H12.3802L11.682 13.5767C11.6419 14.0977 11.2075 14.5 10.6849 14.5H5.31508C4.79254 14.5 4.3581 14.0977 4.31802 13.5767Z"
            />
          </svg>
          Hold to Destroy
        </div>
      )}
    </button>
  );
}
