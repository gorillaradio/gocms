import { BlockData } from "../types/blocks";
import { Hero, Content, Footer } from "./blocks";

interface BlockRendererProps {
  block: BlockData;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const { type, variant, props } = block;

  switch (type) {
    case "hero":
      return <Hero {...props} variant={variant as any} />;
    case "content":
      return <Content {...props} variant={variant as any} />;
    case "footer":
      return <Footer {...props} variant={variant as any} />;
    default:
      console.warn(`Unknown block type: ${type}`);
      return null;
  }
}