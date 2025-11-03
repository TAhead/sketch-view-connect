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
      title: "Error",
      description: "Tree is not running. Action cannot be performed.",
      variant: "destructive",
    });
    return false;
  };

  const goHome = async () => {
    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot move to home: Workflow is active",
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
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Robot moved to home position",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to move to home position",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openGrip = async () => {
    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot open gripper: Workflow is active",
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
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Gripper opened",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open gripper",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeGrip = async () => {
    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot close gripper: Workflow is active",
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
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Gripper closed",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to close gripper",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCollisionError = async () => {
    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot clear collision: Workflow is active",
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
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Collision cleared",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to clear collision",
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
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Shutdown initiated",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to shutdown system",
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
