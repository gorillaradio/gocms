import { HeroProps } from "@/core/types/blocks";
import { Button } from "@/components/ui/button";

export function Hero({ title, subtitle, image, cta, variant }: HeroProps) {
  const baseClasses = "w-full py-16 px-4";
  
  const variantClasses = {
    full: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground min-h-[80vh] flex items-center justify-center",
    split: "bg-background grid md:grid-cols-2 gap-8 items-center",
    minimal: "bg-muted text-center py-12"
  };

  return (
    <section className={`${baseClasses} ${variantClasses[variant]}`}>
      <div className="container mx-auto max-w-6xl">
        {variant === "split" ? (
          <>
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-xl text-muted-foreground">{subtitle}</p>
              )}
              {cta && (
                <Button asChild size="lg" className="mt-4">
                  <a href={cta.link}>{cta.text}</a>
                </Button>
              )}
            </div>
            {image && (
              <div className="relative h-96">
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center space-y-6">
            <h1 className={`font-bold ${variant === "full" ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-xl ${variant === "full" ? "text-primary-foreground/90" : "text-muted-foreground"} max-w-3xl mx-auto`}>
                {subtitle}
              </p>
            )}
            {cta && (
              <Button asChild size="lg" variant={variant === "full" ? "secondary" : "default"} className="mt-4">
                <a href={cta.link}>{cta.text}</a>
              </Button>
            )}
            {image && variant === "minimal" && (
              <div className="relative h-64 mt-8 max-w-2xl mx-auto">
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}