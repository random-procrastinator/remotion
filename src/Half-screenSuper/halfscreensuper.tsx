import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  staticFile,
  Img,
} from "remotion";
import { z } from "zod";

// --- Configuration & Types ---

const FPS = 30;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Geometry: A C-shaped arc on the right side
// Center of the arc circle
const CX = 1450;
const CY = 540;
const RADIUS = 400;

const STROKE_WIDTH = 4;
const DOT_GAP = 20;

// Timing Constants
const CIRCLE_ANIM_DURATION = 12;
const TEXT_START_DELAY = 6;
// Prompt sequence: "3. Circle Anim (12fr) ... 4. Text Anim ... startDelay: 6 frames after circle animation".
const HOLD_DURATION = 15;
const TYPE_SPEED = 2; // frames per char

const THEME = {
  pathColor: "rgba(255, 255, 255, 0.15)", // Static path
  activePathColor: "#ffffff",
  dotColor: "#ffffff",
  textColor: "#ffffff",
  fontFamily: "sans-serif",
  fontSize: 32,
};

// Checkpoint Interface
export interface Checkpoint {
  id: number;
  pathProgress: number; // 0 to 1
  text: string;
  icon?: string; // Placeholder for icon name
}

// Default Data matching the user's scenario
const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  { id: 1, pathProgress: 0.15, text: "Project Initialization", icon: "check" },
  { id: 2, pathProgress: 0.35, text: "Data Ingestion", icon: "database" },
  { id: 3, pathProgress: 0.55, text: "AI Processing", icon: "cpu" },
  { id: 4, pathProgress: 0.75, text: "Quality Assurance", icon: "shield" },
  { id: 5, pathProgress: 0.9, text: "Final Deployment", icon: "rocket" },
];

export const halfScreenSuperSchema = z.object({
  checkpoints: z
    .array(
      z.object({
        id: z.number(),
        pathProgress: z.number().min(0).max(1),
        text: z.string(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
});

type HalfScreenSuperProps = z.infer<typeof halfScreenSuperSchema>;

// --- Helper Functions ---

// Calculate position on the arc based on progress (0 -> 1)
// Path: Top (270deg) -> Left (180deg) -> Bottom (90deg)
const getPathPosition = (progress: number) => {
  // Angle in radians: 270 deg -> 90 deg is a decrease of 180 deg (PI)
  // Start: 3PI/2 (4.712...) -> End: PI/2 (1.571...)
  // We use standard SVG math: angle 0 is Right (3 o'clock). Clockwise is positive.
  // wait, SVG y is down.
  // 0 = Right, 90 (PI/2) = Bottom, 180 (PI) = Left, 270 (3PI/2) = Top.
  // Direction "Forward along path": Top -> Left -> Bottom.
  // This is Counter-Clockwise in visual space (12 -> 9 -> 6).
  // In SVG angles: 270 -> 180 -> 90.

  const startAngle = 1.5 * Math.PI; // 270 deg
  const totalAngleSpan = -Math.PI; // -180 deg

  const angle = startAngle + progress * totalAngleSpan;

  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY + RADIUS * Math.sin(angle),
    angle,
  };
};

const getArcPathD = () => {
  // Start point (Top)
  const start = getPathPosition(0);
  // End point (Bottom)
  const end = getPathPosition(1);

  // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
  // We go from Start to End.
  // Center is to the "Left" of the vector Start->End? No. vector is Top->Bottom. Center is Right.
  // So we are curving Left.
  // SVG Sweep: 1 is "positive angle direction" (Clockwise in screen coords usually, but let's trust 0/1 logic).
  // 0 = Counter-Clockwise (smaller angle moves).
  // We start at 270, go to 90. That is CCW. So sweep-flag 0.

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 0 ${end.x} ${end.y}`;
};

// --- Components ---

// Simple SVG Icons
const Icons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  check: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  database: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  cpu: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
    </svg>
  ),
  shield: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  rocket: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  default: (props) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
};

const CheckpointMarker: React.FC<{
  checkpoint: Checkpoint;
  activeFrame: number; // The frame relative to this checkpoint's activation
  isActive: boolean; // Has the line reached this checkpoint?
}> = ({ checkpoint, activeFrame, isActive }) => {
  const { x, y } = getPathPosition(checkpoint.pathProgress);

  // 3. Circle Animation: duration 12 frames, scale 0->1, opacity 0->1, easeOut
  const appearProgress = interpolate(
    activeFrame,
    [0, CIRCLE_ANIM_DURATION],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.ease),
    },
  );

  const scale = appearProgress;
  const opacity = appearProgress; // Also fade in

  // 4. Text Typing
  // startDelay: 6 frames after circle animation
  const textStartFrame = CIRCLE_ANIM_DURATION + TEXT_START_DELAY;

  // Calculate text duration based on length
  const textLength = checkpoint.text.length;
  const textDuration = textLength * TYPE_SPEED;

  const textCharCount = interpolate(
    activeFrame,
    [textStartFrame, textStartFrame + textDuration],
    [0, textLength],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const visibleText = checkpoint.text.substring(0, Math.floor(textCharCount));

  // Choose icon
  const IconComponent = Icons[checkpoint.icon || "default"] || Icons.default;

  // Render nothing if not active (and not just "waiting" - activeFrame could be negative if we passed it in early, but here we control render)
  if (!isActive && activeFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      {/* Circle + Icon container */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 50,
          height: 50,
          // Centering logic
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity: opacity,
          backgroundColor: "#1a1a1a",
          border: "2px solid white",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(0,0,0,0.5)",
          color: "white",
        }}
      >
        <IconComponent width={24} height={24} />
      </div>

      {/* Text Label */}
      <div
        style={{
          position: "absolute",
          left: x + 45, // Offset to right of circle
          top: y,
          transform: "translate(0, -50%)",
          opacity: 1, // Text itself is always opaque, revealed by typing
          fontFamily: THEME.fontFamily,
          fontSize: THEME.fontSize,
          color: THEME.textColor,
          whiteSpace: "nowrap",
          fontWeight: 600,
          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
          // Ensure min height for alignment
          lineHeight: 1,
        }}
      >
        {visibleText}
        {/* Invisible full text to reserve layout? No, absolute position handles it. */}
      </div>
    </div>
  );
};

// --- Timeline Logic ---

// We define a base speed for the flow.
// 2 Seconds per 0.1 progress?
// Let's settle on: Full path (1.0) creates 5 seconds of flow *if uninterrupted*.
const FRAMES_PER_FULL_PATH = 150;
const FLOW_SPEED_MULTIPLIER = 1.5;

interface TimelineEvent {
  cp: Checkpoint;
  startMoveFrame: number;
  arrivalFrame: number;
  pauseDuration: number;
  resumeFrame: number;
  startProgress: number;
  endProgress: number;
}

const calculateTimeline = (checkpoints: Checkpoint[]) => {
  let currentFrame = 0;
  let currentProgress = 0;

  const sortedCPs = [...checkpoints].sort(
    (a, b) => a.pathProgress - b.pathProgress,
  );
  const events: TimelineEvent[] = [];

  for (const cp of sortedCPs) {
    const dist = cp.pathProgress - currentProgress;
    const travelFrames = Math.max(0, Math.round(dist * FRAMES_PER_FULL_PATH));

    const arrivalFrame = currentFrame + travelFrames;

    // Pause Duration Calculation
    const typeTime = cp.text.length * TYPE_SPEED;
    const pauseDuration =
      CIRCLE_ANIM_DURATION + TEXT_START_DELAY + typeTime + HOLD_DURATION;

    const resumeFrame = arrivalFrame + pauseDuration;

    events.push({
      cp,
      startMoveFrame: currentFrame,
      arrivalFrame,
      pauseDuration,
      resumeFrame,
      startProgress: currentProgress,
      endProgress: cp.pathProgress,
    });

    currentFrame = resumeFrame;
    currentProgress = cp.pathProgress;
  }

  // Calculate final completion frame if needed for overall duration (optional)
  const remainingDist = 1.0 - currentProgress;
  const finalTravelFrames = Math.round(remainingDist * FRAMES_PER_FULL_PATH);
  const finalFrame = currentFrame + finalTravelFrames;

  return { events, finalFrame };
};

// --- Main Component ---

export const HalfScreenSuper: React.FC<HalfScreenSuperProps> = ({
  checkpoints = DEFAULT_CHECKPOINTS,
}) => {
  const frame = useCurrentFrame();

  // Precompute timeline
  const { events: timelineEvents } = useMemo(
    () => calculateTimeline(checkpoints),
    [checkpoints],
  );

  // --- State Resolution ---
  let visibleProgress = 0;
  let flowTime = 0;

  // We determine our state by walking through the timeline events
  let foundSegment = false;
  let totalPauseUntilNow = 0;

  for (let i = 0; i < timelineEvents.length; i++) {
    const evt = timelineEvents[i];

    // Case 1: Before or During Travel to this CP
    if (frame < evt.arrivalFrame) {
      const framesInSegment = frame - evt.startMoveFrame;
      const segmentTotalFrames = evt.arrivalFrame - evt.startMoveFrame;
      // Interpolate progress
      const segmentProgress =
        segmentTotalFrames > 0
          ? interpolate(framesInSegment, [0, segmentTotalFrames], [0, 1], {
              extrapolateRight: "clamp",
            })
          : 1;

      const dist = evt.endProgress - evt.startProgress;
      visibleProgress = evt.startProgress + dist * segmentProgress;

      // Flow is active
      flowTime = frame - totalPauseUntilNow;
      foundSegment = true;
      break;
    }

    // Case 2: During Pause at this CP
    if (frame < evt.resumeFrame) {
      // Stopped at checkpoint
      visibleProgress = evt.endProgress;
      // Flow is frozen at the moment of arrival
      // flowTime = arrivalFrame - pauses_before_this_segment
      // Note: totalPauseUntilNow accounts for pauses BEFORE this segment start.
      flowTime = evt.arrivalFrame - totalPauseUntilNow;
      foundSegment = true;
      break;
    }

    // Accumulate pause time for next iterations if we are past this event
    totalPauseUntilNow += evt.pauseDuration;
  }

  // Case 3: After all checkpoints (Final Leg)
  if (!foundSegment) {
    const lastEvent = timelineEvents[timelineEvents.length - 1];
    const frameSinceResume = frame - lastEvent.resumeFrame;

    const remainingDist = 1.0 - lastEvent.endProgress;
    const finalLegFrames = Math.round(remainingDist * FRAMES_PER_FULL_PATH);

    if (frameSinceResume < finalLegFrames) {
      // Still growing to end
      const p = interpolate(frameSinceResume, [0, finalLegFrames], [0, 1], {
        extrapolateRight: "clamp",
      });
      visibleProgress = lastEvent.endProgress + remainingDist * p;
      flowTime = frame - totalPauseUntilNow;
    } else {
      // Fully grown, just flowing
      visibleProgress = 1.0;
      flowTime = frame - totalPauseUntilNow;
    }
  }

  // --- Rendering Calculations ---

  const pathD = getArcPathD();
  const arcLength = Math.PI * RADIUS; // 180 degree arc

  // Flow offset: negative moves "forward" along path
  const flowOffset = -flowTime * FLOW_SPEED_MULTIPLIER;

  // Mask offset: reveals path from 0 to Length
  // strokeDashoffset goes from Length -> 0
  const maskOffset = arcLength * (1 - visibleProgress);

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {/* 2. Static Semi-Circle (Guide) 10% opacity */}
      <svg
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <path
          d={pathD}
          fill="none"
          stroke={THEME.pathColor}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${STROKE_WIDTH} ${DOT_GAP}`} // Static dotted style
          strokeLinecap="round"
          style={{ opacity: 1 }} // Color handles alpha
        />
      </svg>

      {/* 3. Animated Dotted Line */}
      <svg
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <defs>
          <mask id="flow-mask">
            {/* The mask is a SOLID line that grows. */}
            <path
              d={pathD}
              fill="none"
              stroke="white"
              strokeWidth={STROKE_WIDTH + 10} // Thicker to ensure coverage
              pathLength={arcLength}
              strokeDasharray={`${arcLength} ${arcLength}`}
              strokeDashoffset={maskOffset}
              strokeLinecap="butt" // Sharp cutoff for the mask
            />
          </mask>
        </defs>

        {/* The "water" texture */}
        <path
          d={pathD}
          fill="none"
          stroke={THEME.activePathColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round" // Round dots
          strokeDasharray={`0 ${DOT_GAP}`} // 0 length dash = circle dot. Gap 20.
          strokeDashoffset={flowOffset}
          mask="url(#flow-mask)"
        />
      </svg>

      {/* 4. Checkpoints */}
      {timelineEvents.map((evt) => {
        // Active when frame reaches arrivalFrame
        const activeFrame = frame - evt.arrivalFrame;
        const isActive = frame >= evt.arrivalFrame;

        // Optimization: don't render if far future?
        // No, render all, they handle their own visibility (opacity 0)
        return (
          <CheckpointMarker
            key={evt.cp.id}
            checkpoint={evt.cp}
            activeFrame={activeFrame}
            isActive={isActive}
          />
        );
      })}
    </AbsoluteFill>
  );
};
