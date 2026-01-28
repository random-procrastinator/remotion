import "./index.css";
import { Composition } from "remotion";
import { z } from "zod";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
import { Lowerthird } from "./Lowerthird1/Lowerthird";
import { Lowerthird2 } from "./Lowerthird2/lowerthird2";
import { Transition } from "./Transiton/Transiton";
import { KineticTypography } from "./KineticTypography/KineticTypography";
import { HalfScreenSuper } from "./Half-screenSuper/halfscreensuper";
import {
  HorizontalTimeline,
  HorizontalTimelineFromSchema,
  timelineSchemaFromData,
  horizontalTimelineSchema,
} from "./Horizontal_Timeline/Horizontaltimeline";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91dAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />

      <Composition
        id="Lowerthird"
        component={Lowerthird}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Lowerthird2"
        component={Lowerthird2}
        durationInFrames={200}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="transition"
        component={Transition}
        durationInFrames={200}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="KineticTypography"
        component={KineticTypography}
        durationInFrames={200}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="HalfScreenSuper"
        component={HalfScreenSuper}
        durationInFrames={200}
        fps={30}
        width={1920}
        height={1080}
        schema={z.object({
          count: z.number().min(1).max(5).step(1),
        })}
        defaultProps={{
          count: 5,
        }}
      />

      <Composition
        id="HorizontalTimeline"
        component={HorizontalTimeline}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={horizontalTimelineSchema}
        defaultProps={{
          items: [
            { id: 1, icon: "solidfillcircle", size: 80, labelText: "Step 1" },
            { id: 2, icon: "solidfillcircle", size: 120, labelText: "Step 2" },
            { id: 3, icon: "solidfillcircle", size: 120, labelText: "Step 3" },
            { id: 4, icon: "solidfillcircle", size: 80, labelText: "Step 4" },
            { id: 5, icon: "solidfillcircle", size: 80, labelText: "Step 5" },
          ],
          title: {
            text: "Key Learnings",
            fontSize: 48,
            color: "#FFFFFF",
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            topOffset: 60,
          },
          backgroundColor: "#000000",
          lineStyle: {
            color: "#FFA500",
            strokeWidth: 10,
            dotSize: 10,
            gapSize: 15,
            yOffset: 80,
          },
          circleStyle: {
            backgroundColor: "#FFFFFF",
            iconScale: 0.6,
          },
          labelStyle: {
            fontSize: 20,
            color: "#FFFFFF",
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            offsetY: 30,
            width: 160,
          },
          animationTiming: {
            titleDuration: 30,
            circleGrowDuration: 10,
            circleSettleDuration: 5,
            labelFadeInDuration: 5,
            pauseDuration: 15,
          },
        }}
      />

      {/* Example: Blue themed timeline showing reusability */}
      <Composition
        id="HorizontalTimelineBlue"
        component={HorizontalTimeline}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={horizontalTimelineSchema}
        defaultProps={{
          items: [
            {
              id: 1,
              icon: "solidfillcircle",
              size: 100,
              labelText: "Research",
            },
            { id: 2, icon: "solidfillcircle", size: 100, labelText: "Design" },
            { id: 3, icon: "solidfillcircle", size: 100, labelText: "Develop" },
            { id: 4, icon: "solidfillcircle", size: 100, labelText: "Deploy" },
          ],
          title: {
            text: "Project Phases",
            fontSize: 56,
            color: "#00D4FF",
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            topOffset: 80,
          },
          backgroundColor: "#1a1a2e",
          lineStyle: {
            color: "#00D4FF",
            strokeWidth: 8,
            dotSize: 12,
            gapSize: 20,
            yOffset: 60,
          },
          circleStyle: {
            backgroundColor: "#FFFFFF",
            iconScale: 0.5,
          },
          labelStyle: {
            fontSize: 24,
            color: "#00D4FF",
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            offsetY: 40,
            width: 180,
          },
          animationTiming: {
            titleDuration: 40,
            circleGrowDuration: 15,
            circleSettleDuration: 8,
            labelFadeInDuration: 8,
            pauseDuration: 20,
          },
        }}
      />

      {/* Legacy format support */}
      <Composition
        id="HorizontalTimelineLegacy"
        component={HorizontalTimelineFromSchema}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={timelineSchemaFromData}
        defaultProps={{
          data: {
            metadata: {
              title: "Legacy Format Example",
            },
            visualData: [
              { id: 1, icon: "solidfillcircle", size: 80, labelText: "Step 1" },
              {
                id: 2,
                icon: "solidfillcircle",
                size: 120,
                labelText: "Step 2",
              },
              { id: 3, icon: "solidfillcircle", size: 80, labelText: "Step 3" },
            ],
          },
        }}
      />
    </>
  );
};
