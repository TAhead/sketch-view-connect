import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SampleGrid } from "@/components/SampleGrid";
import { StatusMessage } from "@/components/StatusMessage";
import { ProgressBar } from "@/components/ProgressBar";
import { ControlButton } from "@/components/ControlButton";
import { BuddyLogo } from "@/components/BuddyLogo";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "@/components/LogoutButton";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useRobotControl } from "@/hooks/useRobotControl";
import { 
  BookOpen, 
  Settings,
  Home,
  Power,
  Play,
  StopCircle,
  Grip,
  RefreshCw,
} from "lucide-react";

export default function BuddyDashboard() {
  const { user } = useAuth();
  const { isLoading: workflowLoading, start, cancel, resume } = useWorkflow();
  const { isLoading: robotLoading, goHome, openGrip, closeGrip, clearCollisionError, shutdownSystem } = useRobotControl();
  
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
      {/* Header with user info and logout */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Buddy Lab System</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user?.email}</p>
        </div>
        <LogoutButton />
      </div>
      
      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-6 gap-4 p-4 h-[calc(100vh-80px)]">
        
        {/* Empty space - Unite Labs Logo removed */}
        <div className="col-span-2 row-span-1"></div>

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
        <div className="col-span-2 row-span-5 flex flex-col justify-end space-y-4 pb-4">
          <ControlButton variant="secondary" icon={BookOpen} className="w-full">
            Manual
          </ControlButton>
          <ControlButton 
            variant="secondary" 
            icon={Settings} 
            className="w-full"
            onClick={() => window.open('https://docs.google.com/spreadsheets/d/15FLJ_nM6rGRWuEJIopg6WXyK_6q1DcS--HphkpcfUNc/edit?gid=0#gid=0', '_blank')}
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

          </div>
        </div>

        {/* Right Sidebar - Archivierung and Buddy Control */}
        <div className="col-span-2 row-span-4 flex flex-col justify-center space-y-6">
          {/* Archivierung Block */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Archivierung
            </div>
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <ControlButton 
                variant="success" 
                icon={Play} 
                className="w-full"
                disabled={workflowLoading}
                onClick={async () => {
                  if (archivingPaused || showError) {
                    await resume();
                    setArchivingStarted(false);
                    setArchivingPaused(false);
                  } else {
                    await start();
                    setArchivingStarted(true);
                    setArchivingPaused(false);
                  }
                }}
              >
                {(archivingPaused || showError) && archivingStarted ? "Archivierung fortführen" : "Archivierung starten"}
              </ControlButton>
              <ControlButton 
                variant="secondary" 
                icon={StopCircle} 
                className="w-full"
                disabled={workflowLoading}
                onClick={async () => {
                  await cancel();
                  setArchivingStarted(false);
                  setArchivingPaused(false);
                }}
              >
                Archivierung abbrechen
              </ControlButton>
            </div>
          </div>

          {/* Buddy Control Block */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Buddy Control
            </div>
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <ControlButton 
                variant="secondary" 
                icon={Grip} 
                className="w-full"
                disabled={robotLoading}
                onClick={openGrip}
              >
                Greifer öffnen
              </ControlButton>
              <ControlButton 
                variant="secondary" 
                icon={Grip} 
                className="w-full"
                disabled={robotLoading}
                onClick={closeGrip}
              >
                Greifer schließen
              </ControlButton>
              <ControlButton 
                variant="secondary" 
                icon={Home} 
                className="w-full"
                disabled={robotLoading}
                onClick={goHome}
              >
                Home position
              </ControlButton>
              <ControlButton 
                variant="secondary" 
                icon={RefreshCw} 
                className="w-full"
                disabled={robotLoading}
                onClick={clearCollisionError}
              >
                Kollision lösen
              </ControlButton>
              <div className="h-4"></div>
              <ControlButton 
                variant="destructive" 
                icon={Power} 
                className="w-full"
                disabled={robotLoading}
                onClick={shutdownSystem}
              >
                Buddy herunterfahren
              </ControlButton>
            </div>
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div className="col-span-8 col-start-3 row-span-1 flex flex-col">
          <ProgressBar steps={progressSteps} />
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by UniteLabs
          </p>
        </div>
      </div>
    </div>
  );
}