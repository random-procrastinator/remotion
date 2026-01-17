import React from "react";

interface Lowerthird1TextProps {
  text?: string;
  className?: string;
}

export const Lowerthird1Text: React.FC<Lowerthird1TextProps> = ({
  text = "Kumar",
 
}) => {
  return (
    <p>
      {text}
    </p>
  );
};
