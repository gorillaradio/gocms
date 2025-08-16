import { FooterProps } from "../../types/blocks";

export function Footer({ companyName, description, links, variant }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  const baseClasses = "w-full py-8 px-4 bg-secondary text-secondary-foreground";

  return (
    <footer className={baseClasses}>
      <div className="container mx-auto max-w-6xl">
        {variant === "detailed" ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{companyName}</h3>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            
            {links && links.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Collegamenti</h4>
                <ul className="space-y-2">
                  {links.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Contatti</h4>
              <p className="text-muted-foreground">
                © {currentYear} {companyName}. Tutti i diritti riservati.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-6 mb-4">
              {links && links.map((link, index) => (
                <a 
                  key={index}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <p className="text-muted-foreground">
              © {currentYear} {companyName}. Tutti i diritti riservati.
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}