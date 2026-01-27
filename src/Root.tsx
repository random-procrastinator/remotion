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
  HorizontalTimelineFromSchema as HorizontalTimeline, 
  timelineSchemaFromData 
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
        schema={timelineSchemaFromData}
        defaultProps={{
          data: {
            metadata: {
              title: "Key Learnings",
            },
            visualData: [
              {
                id: 1,
                icon: "solidfillcircle",
                size: 80,
                labelText: "Step 1",
              },
              {
                id: 2,
                icon: "solidfillcircle",
                size: 120,
                labelText: "Step 2",
              },
              {
                id: 3,
                icon: "solidfillcircle",
                size: 120,
                labelText: "Step 3",
              },
              {
                id: 4,
                icon: "solidfillcircle",
                size: 80,
                labelText: "Step 4",
              },
              {
                id: 5,
                icon: "solidfillcircle",
                size: 80,
                labelText: "Step 5",
              },
            ],
          },
        }}
      />
    </>
  );
};