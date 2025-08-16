import { ContentProps } from "../../types/blocks";

export function Content({ title, content, variant }: ContentProps) {
  const baseClasses = "w-full py-12 px-4";
  
  const variantClasses = {
    default: "bg-background",
    centered: "bg-background text-center",
    columns: "bg-muted"
  };

  const contentClasses = {
    default: "prose prose-lg max-w-4xl mx-auto",
    centered: "prose prose-lg max-w-3xl mx-auto text-center",
    columns: "prose prose-lg max-w-6xl mx-auto columns-2 gap-8"
  };

  return (
    <section className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="container mx-auto">
        {title && (
          <h2 className={`text-3xl font-bold mb-8 ${variant === "centered" ? "text-center" : ""}`}>
            {title}
          </h2>
        )}
        <div 
          className={contentClasses[variant]}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}