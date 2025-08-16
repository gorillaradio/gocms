export interface HeroProps {
  title: string;
  subtitle?: string;
  image?: string;
  cta?: {
    text: string;
    link: string;
  };
  variant: "full" | "split" | "minimal";
}

export interface ContentProps {
  title?: string;
  content: string; // HTML content
  variant: "default" | "centered" | "columns";
}

export interface FooterProps {
  companyName: string;
  description?: string;
  links?: Array<{
    label: string;
    href: string;
  }>;
  variant: "simple" | "detailed";
}

export interface BlockData {
  id: string;
  type: string;
  variant: string;
  props: HeroProps | ContentProps | FooterProps;
  order: number;
}