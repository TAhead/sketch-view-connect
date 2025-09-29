import { useState } from "react";
import { SampleGrid } from "@/components/SampleGrid";
import { StatusMessage } from "@/components/StatusMessage";
import { ProgressBar } from "@/components/ProgressBar";
import { ControlButton } from "@/components/ControlButton";
import { BuddyLogo } from "@/components/BuddyLogo";
import { 
  BookOpen, 
  Settings,
  Home,
  Power,
  Play,
  Pause,
  StopCircle,
  Grip,
  RefreshCw
} from "lucide-react";

export default function BuddyDashboard() {
  // Sample data matching the mockup
  const [sampleData] = useState([
    [false, false, false, false, false, false],
    [false, false, false, false, false, true],
    [false, false, false, false, false, false],
    [true, true, true, true, true, true]
  ]);

  const [rackInfo] = useState({
    number: 1,
    id: "abc123",
    archivedSamples: 7
  });

  const [progressSteps] = useState([
    { label: "Initialisierung", status: "completed" as const },
    { label: "Rack kalibrieren", status: "completed" as const },
    { label: "Proben archivieren", status: "active" as const },
    { label: "Archivierung abgeschlossen", status: "pending" as const },
  ]);

  const [showError] = useState(true);
  const [archivingPaused, setArchivingPaused] = useState(false);
  const [archivingStarted, setArchivingStarted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-6 gap-4 p-4 h-screen">
        
        {/* Top Left - Unite Labs Logo */}
        <div className="col-span-2 row-span-1">
          <div className="p-4 bg-card border-2 border-border rounded-lg text-center h-full flex items-center justify-center">
            <div className="text-sm font-medium text-muted-foreground">
              Unite<br />Labs<br />Logo
            </div>
          </div>
        </div>

        {/* Top Center - Buddy Logo */}
        <div className="col-span-8 row-span-1">
          <BuddyLogo />
        </div>

        {/* Top Right - bAhead Logo */}
        <div className="col-span-2 row-span-1">
          <div className="p-4 bg-card border-2 border-border rounded-lg text-center h-full flex items-center justify-center">
            <div className="text-sm font-medium text-muted-foreground">
              bAhead<br />Logo
            </div>
          </div>
        </div>

        {/* Left Sidebar - Lower buttons */}
        <div className="col-span-2 row-span-4 flex flex-col justify-end space-y-4 pb-16">
          <ControlButton variant="secondary" icon={BookOpen} className="w-full">
            Manual
          </ControlButton>
          <ControlButton 
            variant="secondary" 
            icon={Settings} 
            className="w-full"
            onClick={() => window.open('https://example.com/stoerungsprotokoll', '_blank')}
          >
            Störungsprotokoll
          </ControlButton>
        </div>

        {/* Main Content Area */}
        <div className="col-span-8 row-span-4 space-y-4">
          
          {/* Error Message */}
          {showError && (
            <StatusMessage
              type="error"
              message="Buddy hatte eine Kollision. Vergewissern Sie sich, dass der Greifer leer ist und klicken Sie auf Archivierung fortführen."
              className="mb-4"
            />
          )}

          {/* Sample Grid and Info */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="space-y-4">
                <SampleGrid samples={sampleData} />
                
                {/* Rack Information */}
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Rack:</span> {rackInfo.number}</div>
                  <div><span className="font-medium">Rack ID:</span> {rackInfo.id}</div>
                  <div><span className="font-medium">Im Rack archivierte Proben:</span> {rackInfo.archivedSamples}</div>
                </div>
              </div>
            </div>

            {/* Control Buttons - Centered */}
            <div className="flex justify-center">
              <div className="space-y-4 w-80">
                <ControlButton 
                  variant="success" 
                  icon={Play} 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    if (archivingPaused || showError) {
                      // If resuming from pause/error, go back to initial state
                      setArchivingStarted(false);
                      setArchivingPaused(false);
                    } else {
                      // Starting archiving
                      setArchivingStarted(true);
                      setArchivingPaused(false);
                    }
                  }}
                >
                  {(archivingPaused || showError) && archivingStarted ? "Archivierung fortführen" : "Archivierung starten"}
                </ControlButton>
                <ControlButton 
                  variant="warning" 
                  icon={Pause} 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    setArchivingPaused(true);
                    setArchivingStarted(true);
                  }}
                >
                  {archivingPaused ? "Archivierung pausiert" : "Archivierung pausieren"}
                </ControlButton>
                <ControlButton variant="secondary" icon={StopCircle} size="lg" className="w-full">
                  Archivierung abbrechen
                </ControlButton>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Buddy Control */}
        <div className="col-span-2 row-span-4 flex flex-col justify-end pb-16">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Buddy Control
            </div>
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <ControlButton variant="secondary" icon={Grip} className="w-full">
                Greifer öffnen
              </ControlButton>
              <ControlButton variant="secondary" icon={Home} className="w-full">
                Home position
              </ControlButton>
              <ControlButton variant="secondary" icon={RefreshCw} className="w-full">
                Kollision lösen
              </ControlButton>
              <div className="h-4"></div>
              <ControlButton variant="destructive" icon={Power} className="w-full">
                Buddy herunterfahren
              </ControlButton>
            </div>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="col-span-8 col-start-3 row-span-1">
          <ProgressBar steps={progressSteps} />
        </div>
      </div>
    </div>
  );
}