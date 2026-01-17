import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface Lowerthird2TextProps {
  text?: string;
  className?: string;
  typingSpeed?: number;
  startFrame?: number;
}

export const Lowerthird2Text: React.FC<Lowerthird2TextProps> = ({
  text = "dummy text for lowerthird2",
  className = "",
  typingSpeed = 4,
  startFrame = 42,
}) => {
  const frame = useCurrentFrame();
  const videoConfig = useVideoConfig();

  // Calculate how many characters to display based on frame and typing speed
  const adjustedFrame = Math.max(0, frame - startFrame);
  const charsToShow = Math.min(
    Math.floor(adjustedFrame / typingSpeed),
    text.length
  );

  const displayedText = text.slice(0, charsToShow);
  const showCursor = charsToShow < text.length && Math.floor(frame / 10) % 2 === 0;

  return (
    <p className={className}>
      {displayedText}
      {showCursor && <span style={{ opacity: 0.7 }}>|</span>}
    </p>
  );
};
