export const Footer = () => {
  return (
    <footer className="py-2 text-center">
      <div className="flex items-center justify-center gap-4">
        <a 
          href="https://bahead.de/imprint/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Impressum
        </a>
        <a 
          href="https://bahead.de/datasecurity/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Datenschutz
        </a>
      </div>
    </footer>
  );
};
