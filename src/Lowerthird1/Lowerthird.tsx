import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img, staticFile,
} from "remotion";
import { Lowerthird1Text } from "./lowerthird1-text";


export const Lowerthird: React.FC = () => {
  const videoConfig = useVideoConfig();
  const frame = useCurrentFrame();

  // Slide in from left
  const slideInProgress = spring({
    config: {
      damping: 100,
      mass: 0.5,
    },
    fps: videoConfig.fps,
    frame,
  });

  const translateX = interpolate(slideInProgress, [0, 1], [-500, 0]);

//   // Scale animation
//   const scaleValue = interpolate(frame, [0, 20], [0.1, 1], {
//     extrapolateRight: "clamp",
//   });

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

  // Subtle rotation animation
  const rotation = interpolate(
    frame,
    [0, videoConfig.durationInFrames],
    [0, 0]
  );

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "end",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateX(${translateX}px)  rotate(${rotation}deg)`,
          transformOrigin: "center bottom",
          position: "relative",
        }}
      >
        <Img
          src={staticFile("logo.svg")}
          style={{ width: 800, height: 200, display: "block" }}
        />
        <div style={{position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-10%, -20%)",
        margin: 0,
      }} className=" text-4xl text-white  font-KohinoorDevnagri ">
          <Lowerthird1Text  />
        </div>
      </div>
    </AbsoluteFill>
  );
};


