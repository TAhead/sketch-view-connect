import { useEffect, useState } from "react";
import baheadLogo from "@/assets/bahead_logo.png";
import { removeBackground, loadImage } from "@/utils/backgroundRemoval";

export function BaheadLogo() {
  const [processedLogoUrl, setProcessedLogoUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processLogo = async () => {
      try {
        // Load the image
        const response = await fetch(baheadLogo);
        const blob = await response.blob();
        const imgElement = await loadImage(blob);
        
        // Remove background
        const processedBlob = await removeBackground(imgElement);
        const url = URL.createObjectURL(processedBlob);
        setProcessedLogoUrl(url);
      } catch (error) {
        console.error('Failed to process logo:', error);
        // Fallback to original logo
        setProcessedLogoUrl(baheadLogo);
      } finally {
        setIsProcessing(false);
      }
    };

    processLogo();

    return () => {
      if (processedLogoUrl && processedLogoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(processedLogoUrl);
      }
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      {isProcessing ? (
        <div className="text-sm text-muted-foreground">Processing logo...</div>
      ) : (
        <img 
          src={processedLogoUrl} 
          alt="bAhead Logo" 
          className="max-h-full max-w-full object-contain"
        />
      )}
    </div>
  );
}
