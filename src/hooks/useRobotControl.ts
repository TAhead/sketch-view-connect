import { useState } from "react";
import {
  moveToHome,
  openGripper,
  closeGripper,
  clearCollision,
  shutdown,
  getTreeState,
  startTree,
} from "@/services/fastapi";
import { useToast } from "@/hooks/use-toast";

interface UseRobotControlProps {
  treeState: boolean;
  workflowState: boolean;
}

interface UseRobotControlReturn {
  isLoading: boolean;
  goHome: () => Promise<void>;
  openGrip: () => Promise<void>;
  closeGrip: () => Promise<void>;
  clearCollisionError: () => Promise<void>;
  shutdownSystem: () => Promise<void>;
}

export function useRobotControl({ treeState, workflowState }: UseRobotControlProps): UseRobotControlReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const ensureTreeStarted = (): boolean => {
    if (treeState) {
      return true;
    }

    // If the tree is not running, show an error and return false.
    toast({
      title: "Fehler",
      description: "Buddy ist offline. Aktion kann nicht ausgeführt werden.",
      variant: "destructive",
    });
    return false;
  };

  const goHome = async () => {
    if (workflowState) {
      toast({
        title: "Fehler",
        description: "Anfahren der Grundstellung nicht möglich: Eine Archivierung ist aktiv",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const treeStarted = ensureTreeStarted();
      if (!treeStarted) {
        setIsLoading(false);
        return;
      }

      const { error } = await moveToHome();

      if (error) {
        toast({
          title: "Fehler",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolg",
        description: "Buddy fährt in die Grundstellung",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Anfahren der Grundstellung fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openGrip = async () => {
    if (workflowState) {
      toast({
        title: "Fehler",
        description: "Greifer kann nicht geöffnet werden: Eine Archivierung ist aktiv",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const treeStarted = ensureTreeStarted();
      if (!treeStarted) {
        setIsLoading(false);
        return;
      }

      const { error } = await openGripper();

      if (error) {
        toast({
          title: "Fehler",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolg",
        description: "Greifer geöffnet",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Öffnen des Greifers fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeGrip = async () => {
    if (workflowState) {
      toast({
        title: "Fehler",
        description: "Greifer kann nicht geschlossen werden: Eine Archivierung ist aktiv",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const treeStarted = ensureTreeStarted();
      if (!treeStarted) {
        setIsLoading(false);
        return;
      }

      const { error } = await closeGripper();

      if (error) {
        toast({
          title: "Fehler",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolg",
        description: "Greifer geschlossen",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Schließen des Greifers fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCollisionError = async () => {
    if (workflowState) {
      toast({
        title: "Fehler",
        description: "Kollision kann nicht gelöst werden: Archivierung ist aktiv",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const treeStarted = ensureTreeStarted();
      if (!treeStarted) {
        setIsLoading(false);
        return;
      }

      const { error } = await clearCollision();

      if (error) {
        toast({
          title: "Fehler",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolg",
        description: "Kollision gelöst",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Lösen der Kollision fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const shutdownSystem = async () => {
    setIsLoading(true);
    try {
      const treeStarted = ensureTreeStarted();
      if (!treeStarted) {
        setIsLoading(false);
        return;
      }

      const { error } = await shutdown();

      if (error) {
        toast({
          title: "Fehler",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Erfolg",
        description: "Herunterfahren initiiert",
      });
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Herunterfahren fehlgeschlagen",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    goHome,
    openGrip,
    closeGrip,
    clearCollisionError,
    shutdownSystem,
  };
}
