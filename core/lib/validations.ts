import { z } from "zod";

export const heroSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  cta: z.object({
    text: z.string().min(1, "CTA text is required"),
    link: z.string().min(1, "CTA link is required")
  }).optional(),
  variant: z.enum(["full", "split", "minimal"])
});

export const contentSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  variant: z.enum(["default", "centered", "columns"])
});

export const footerSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  links: z.array(z.object({
    label: z.string().min(1, "Link label is required"),
    href: z.string().min(1, "Link URL is required")
  })).optional(),
  variant: z.enum(["simple", "detailed"])
});

export const blockSchema = z.object({
  id: z.string(),
  type: z.enum(["hero", "content", "footer"]),
  variant: z.string(),
  props: z.union([heroSchema, contentSchema, footerSchema]),
  order: z.number()
});

export function getSchemaForBlockType(type: string) {
  switch (type) {
    case "hero":
      return heroSchema;
    case "content":
      return contentSchema;
    case "footer":
      return footerSchema;
    default:
      throw new Error(`Unknown block type: ${type}`);
  }
}