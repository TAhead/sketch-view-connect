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
import { useSampleCount } from "@/hooks/useSampleCount";
import { useErrorInfo } from "@/hooks/useErrorInfo";
import { BookOpen, Settings, Home, Power, Play, StopCircle, Grip, RefreshCw } from "lucide-react";

export default function BuddyDashboard() {
  const { user } = useAuth();
  const { isLoading, start, cancel, resume, selectUrine, selectEswab } = useWorkflow();
  const {
    isLoading: robotLoading,
    goHome,
    openGrip,
    closeGrip,
    clearCollisionError,
    shutdownSystem,
  } = useRobotControl();
  const { sampleCount, fetchSampleCount } = useSampleCount();
  const { errorCode, errorMessage, fetchErrorInfo } = useErrorInfo();

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

  const sampleData = generateSampleGrid(sampleCount);

  useEffect(() => {
    fetchSampleCount();
    const interval = setInterval(fetchSampleCount, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [fetchSampleCount]);

  useEffect(() => {
    fetchErrorInfo();
    const interval = setInterval(fetchErrorInfo, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [fetchErrorInfo]);

  const [rackInfo] = useState({
    number: 1,
    id: "abc123",
    archivedSamples: 7,
  });

  const [progressSteps] = useState([
    { label: "Initialisierung", status: "completed" as const },
    { label: "Rack kalibrieren", status: "completed" as const },
    { label: "Proben archivieren", status: "active" as const },
    { label: "Archivierung abgeschlossen", status: "pending" as const },
  ]);

  const showError = errorCode !== null && errorCode !== 0;

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
          <BuddyLogo />
        </div>

        {/* Top Right - bAhead Logo */}
        <div className="col-span-2 row-span-1 flex items-center justify-center">
          <img src={baheadLogo} alt="bAhead Logo" className="max-h-full max-w-full object-contain" />
        </div>

        {/* Left Sidebar - Lower buttons */}
        <div className="col-span-2 row-span-5 flex flex-col justify-start pt-90 space-y-6">
          {/* Probentyp Block */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Probentyp</div>
            <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
              <ControlButton
                variant="secondary"
                className="w-full"
                icon={Play}
                //disabled={workflowLoading}
                onClick={async () => {
                  await start();
                }}
              >
                ESwab
              </ControlButton>
              <ControlButton
                variant="secondary"
                className="w-full"
                icon={Play}
                //disabled={workflowLoading}
                onClick={async () => {
                  await selectUrine();
                }}
              >
                Urine-Monovette
              </ControlButton>
            </div>
          </div>

          {/* Rack Information */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Rack Information</div>
            <div className="space-y-2 text-sm p-3 bg-card border border-border rounded-lg">
              <div>
                <span className="font-medium">Rack:</span> {rackInfo.number}
              </div>
              <div>
                <span className="font-medium">Rack ID:</span> {rackInfo.id}
              </div>
              <div>
                <span className="font-medium">Im Rack archivierte Proben:</span> {rackInfo.archivedSamples}
              </div>
            </div>
          </div>

          {/* This structure exactly matches the right sidebar */}
          <div className="flex-grow flex flex-col justify-end">
            <div className="mb-20">
              <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Support</div>
              <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
                <ControlButton variant="secondary" icon={BookOpen} className="w-full">
                  Manual
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
          {showError && errorMessage && <StatusMessage type="error" message={errorMessage} className="mb-4" />}

          {/* Sample Grid and Info */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="space-y-4">
                <SampleGrid samples={sampleData} />

                {/* Sample Type Information */}
                <div className="text-sm text-center">
                  <span className="font-medium">Aufgewählter Probentyp:</span>
                </div>
              </div>
            </div>
          </div>
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
          <div className="flex-grow flex flex-col justify-end">
            {" "}
            {/* Added flex-grow and justify-end */}
            <div className="-mb-20">
              {" "}
              {/* Added a space-y-6 container for spacing similar to the left */}
              <div className="text-sm font-medium text-muted-foreground mb-3 text-center">Buddy Control</div>
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
