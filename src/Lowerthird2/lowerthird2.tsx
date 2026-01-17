import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Img, staticFile,
} from "remotion";
import { Lowerthird2Text } from "./lowerthird2-text";

export const Lowerthird2: React.FC = () => {
  const videoConfig = useVideoConfig();
  const frame = useCurrentFrame();

  // Swipe animation from left to right
  const swipeProgress = interpolate(
    frame,
    [0, videoConfig.durationInFrames * 0.2],
    [-1920, 0],
    { extrapolateRight: "clamp" }
  );

  // Opacity fade in
  const opacityIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Opacity fade out at the end
  const opacityOut = interpolate(
    frame,
    [videoConfig.durationInFrames - 20, videoConfig.durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" }
  );

  const opacity = Math.min(opacityIn, opacityOut);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateX(${swipeProgress}px)`,
          transformOrigin: "center",
          position: "relative",
        }}
      >
        <Img
          src={staticFile("lowerthirdfortext.svg")}
          style={{ width: 1920, height: 400, display: "block" }}
        />
        <div style={{
          position: "absolute",
          
          
          top: "50%",
          left: "50%",
          transform: "translate(-10%, -20%)",
          margin: 0,
        }} className=" w-full text-4xl text-white font-KohinoorDevnagri  text-left ">
          <Lowerthird2Text />
        </div>
      </div>
    </AbsoluteFill>
  );
};


