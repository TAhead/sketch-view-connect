import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SampleGrid } from "@/components/SampleGrid";
import baheadLogo from "@/assets/bahead_logo.png";
import { StatusMessage } from "@/components/StatusMessage";
import { ProgressBar } from "@/components/ProgressBar";
import { ControlButton } from "@/components/ControlButton";
import { BuddyLogo } from "@/components/BuddyLogo";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "@/components/LogoutButton";
import { Footer } from "@/components/Footer";
import { useWorkflow } from "@/hooks/useWorkflow";
import { useRobotControl } from "@/hooks/useRobotControl";
import { useSmartDataRetrieval } from "@/hooks/useDataRetrieval";
import { BookOpen, Settings, Home, Power, Play, StopCircle, Grip, RefreshCw } from "lucide-react";

export default function BuddyDashboard() {
  const { user } = useAuth();
  const {
    isLoading,
    workflowState,
    treeState,
    selectUrine,
    selectEswab,
    start,
    cancel,
    resume,
    onSelectUrine,
    onSelectEswab,
  } = useWorkflow();
  const data = useSmartDataRetrieval();
  const {
    isLoading: robotLoading,
    goHome,
    openGrip,
    closeGrip,
    clearCollisionError,
    shutdownSystem,
  } = useRobotControl({ treeState, workflowState });

  // Track completed racks and their final sample positions
  const [completedRacks, setCompletedRacks] = useState<Record<string, number>>({});
  const [previousRackId, setPreviousRackId] = useState<string | null>(null);
  const [lastSamplePosition, setLastSamplePosition] = useState<number>(0);

  // Monitor sample info to track rack completion
  useEffect(() => {
    const currentRackId = data.sampleInfo?.rack_id || null;
    const currentPosition = data.sampleInfo?.sample_position || 0;
    
    // Track the last sample position for current rack
    if (currentPosition > 0) {
      setLastSamplePosition(currentPosition);
    }
    
    // Detect rack change (new rack_id appeared, meaning previous rack completed)
    if (previousRackId !== null && currentRackId !== null && currentRackId !== previousRackId) {
      // Store the previous rack's final position
      setCompletedRacks(prev => ({
        ...prev,
        [previousRackId]: lastSamplePosition
      }));
    }
    
    setPreviousRackId(currentRackId);
  }, [data.sampleInfo, previousRackId, lastSamplePosition]);

  // Determine which position (1-4) is currently active based on rack_id
  const getCurrentRackPosition = (): number | null => {
    const currentRackId = data.sampleInfo?.rack_id;
    if (!currentRackId || !data.rackIds) return null;
    
    // Find which position matches the current rack_id
    for (let i = 1; i <= 4; i++) {
      const positionKey = `position_${i}` as keyof typeof data.rackIds;
      if (data.rackIds[positionKey] === currentRackId) {
        return i;
      }
    }
    
    return null;
  };

  // Convert sample count to 10x5 grid (bottom-left to top-right)
  const generateSampleGrid = (count: number | null): boolean[][] => {
    const grid: boolean[][] = Array(5)
      .fill(null)
      .map(() => Array(10).fill(false));
    if (count === null || count === 0) return grid;

    for (let i = 0; i < Math.min(count, 50); i++) {
      const row = 4 - Math.floor(i / 10); // Start from bottom (row 4)
      const col = i % 10;
      grid[row][col] = true;
    }

    return grid;
  };

  const sampleData = generateSampleGrid(data.sampleInfo?.sample_position || null);

  // Format rack positions with dynamic sample counts
  const currentPosition = getCurrentRackPosition();
  const currentSamplePosition = data.sampleInfo?.sample_position || 0;

  const rackPositions = [1, 2, 3, 4].map(position => {
    const rackId = data.rackIds?.[`position_${position}`] || "N/A";
    
    let archivedSamples = 0;
    
    if (rackId !== "N/A") {
      // If this is the active rack, show current sample position
      if (position === currentPosition) {
        archivedSamples = currentSamplePosition;
      }
      // If this rack was completed, show its final position
      else if (completedRacks[rackId] !== undefined) {
        archivedSamples = completedRacks[rackId];
      }
      // Otherwise it's pending (show 0)
    }
    
    return {
      position,
      id: rackId,
      archivedSamples
    };
  });

  // Calculate progress steps dynamically
  const progressSteps = [
    {
      label: "Initialisierung",
      status:
        treeState && workflowState && data.toolCalibrationState
          ? ("completed" as const)
          : treeState || workflowState
            ? ("active" as const)
            : ("pending" as const),
    },
    {
      label: "Rack kalibrieren",
      status:
        data.toolCalibrationState && data.containerCalibrationState && treeState && workflowState
          ? ("completed" as const)
          : data.toolCalibrationState && !data.containerCalibrationState && treeState && workflowState
            ? ("active" as const)
            : ("pending" as const),
    },
    {
      label: "Proben archivieren",
      status:
        treeState &&
        workflowState &&
        data.toolCalibrationState &&
        data.containerCalibrationState &&
        data.rackSampleCount === 50
          ? ("completed" as const)
          : treeState &&
              workflowState &&
              data.toolCalibrationState &&
              data.containerCalibrationState &&
              (data.rackSampleCount ?? 0) > 0 &&
              (data.rackSampleCount ?? 0) < 50
            ? ("active" as const)
            : ("pending" as const),
    },
    {
      label: "Archivierung abgeschlossen",
      status: "pending" as const,
    },
  ];

  // Only show error if there's a valid error with a message that's not AttributeError
  const showError = 
    data.errorInfo?.error_code !== null && 
    data.errorInfo?.error_code !== 0 &&
    data.errorInfo?.error_message &&
    data.errorInfo.error_message.trim() !== '' &&
    !data.errorInfo.error_message.includes('AttributeError');

  console.log('Error Info:', data.errorInfo, 'Show Error:', showError);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info and logout */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Buddy - Labor Automatisierung</h1>
          <p className="text-sm text-muted-foreground">Wilkommen, {user?.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-6 gap-4 p-4 h-[calc(100vh-80px)]">
        {/* Empty space - Unite Labs Logo removed */}
        <div className="col-span-2 row-span-1"></div>

        {/* Top Center - Buddy Logo */}
        <div className="col-span-8 row-span-1 flex items-center justify-center">
          <BuddyLogo treeState={treeState} />
        </div>

        {/* Top Right - bAhead Logo */}
        <div className="col-span-2 row-span-1 flex items-center justify-center">
          <img src={baheadLogo} alt="bAhead Logo" className="max-h-full max-w-full object-contain" />
        </div>

        {/* Left Sidebar - Lower buttons */}
        <div className="col-span-2 row-span-4 flex flex-col justify-start pt-90 space-y-6">
          {/* Probentyp Block */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Probentyp</div>
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <ControlButton
                variant="secondary"
                className={`w-full ${selectEswab ? 'border-2 border-green-500' : ''}`}
                icon={Play}
                //disabled={workflowLoading}
                onClick={onSelectEswab}
              >
                ESwab
              </ControlButton>
              <ControlButton
                variant="secondary"
                className={`w-full ${selectUrine ? 'border-2 border-green-500' : ''}`}
                icon={Play}
                //disabled={workflowLoading}
                onClick={onSelectUrine}
              >
                Urin-Monovette
              </ControlButton>
            </div>
          </div>

          {/* Rack Information */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Rack Information</div>
            <div className="space-y-3">
              {rackPositions.map((rack) => (
                <div key={rack.position} className="space-y-0 text-sm p-3 bg-card border border-border rounded-lg leading-tight">
                  <div>
                    <span className="font-medium">Position:</span> {rack.position}
                  </div>
                  <div>
                    <span className="font-medium">Rack ID:</span> {rack.id}
                  </div>
                  <div>
                    <span className="font-medium">Im Rack archivierte Proben:</span> {rack.archivedSamples}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* This structure exactly matches the right sidebar */}
          <div className="flex-grow flex flex-col justify-end">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Support</div>
              <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
                <ControlButton variant="secondary" icon={BookOpen} className="w-full">
                  Anleitung
                </ControlButton>
                <ControlButton
                  variant="secondary"
                  icon={Settings}
                  className="w-full"
                  onClick={() =>
                    window.open(
                      "https://docs.google.com/spreadsheets/d/15FLJ_nM6rGRWuEJIopg6WXyK_6q1DcS--HphkpcfUNc/edit?gid=0#gid=0",
                      "_blank",
                    )
                  }
                >
                  Störungsprotokoll
                </ControlButton>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-8 row-span-4 space-y-4">
          {/* Error Message */}
          {showError && data.errorInfo?.error_message && (
            <StatusMessage type="error" message={data.errorInfo?.error_message} className="mb-4" />
          )}

          {/* Sample Grid and Info */}
          {!showError && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="space-y-4">
                  <SampleGrid samples={sampleData} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Archivierung and Buddy Control */}
        <div className="col-span-2 row-span-4 flex flex-col justify-start pt-90 space-y-6">
          {/* Archivierung Block */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Archivierung</div>
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <ControlButton
                variant="success"
                icon={Play}
                className="w-full"
                //disabled={workflowLoading}
                onClick={async () => {
                  await start();
                }}
              >
                Archivierung starten
              </ControlButton>
              <ControlButton
                variant="secondary"
                icon={StopCircle}
                className="w-full"
                //disabled={workflowLoading}
                onClick={async () => {
                  await cancel();
                }}
              >
                Archivierung abbrechen
              </ControlButton>
            </div>
          </div>

          {/* CHANGE: Removed flex-grow from this div to allow the Buddy Control block to move down */}
          {/* Buddy Control Block moved into a new div with flex-grow to push it down */}
          <div className="flex-grow flex flex-col justify-end pb-4">
            <div>
              {" "}
              {/* Added a space-y-6 container for spacing similar to the left */}
              <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Buddy Bedienfeld</div>
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
                  Grundstellung
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
        </div>

        {/* Bottom Progress Bar */}
        <div className="col-span-8 col-start-3 row-span-1 flex flex-col">
          <ProgressBar steps={progressSteps} />
          <p className="text-xs text-muted-foreground text-center mt-2">Powered by UniteLabs</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
