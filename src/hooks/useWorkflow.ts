import { useState, useEffect } from "react";
import {
  startWorkflow,
  cancelWorkflow,
  resumeWorkflow,
  urineWorkflow,
  eswabWorkflow,
  getTreeState,
  startTree,
} from "@/services/fastapi";
import { useToast } from "@/hooks/use-toast";

interface UseWorkflowReturn {
  isLoading: boolean;
  workflowState: boolean;
  treeState: boolean;
  selectUrine: boolean;
  selectEswab: boolean;
  start: () => Promise<void>;
  cancel: () => Promise<void>;
  resume: () => Promise<void>;
  onSelectUrine: () => Promise<void>;
  onSelectEswab: () => Promise<void>;
}

export function useWorkflow(): UseWorkflowReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [workflowState, setWorkflowState] = useState(false);
  const [treeState, setTreeState] = useState(false);
  const [selectUrine, setSelectUrine] = useState(false);
  const [selectEswab, setSelectEswab] = useState(false);
  const { toast } = useToast();

  // Poll tree state
  useEffect(() => {
    const pollStatus = async () => {
      const { data } = await getTreeState();
      if (data?.tree_state !== undefined) {
        setTreeState(data.tree_state);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const start = async () => {
    // Prevent multiple clicks
    if (isLoading) return;

    // Case: Both selected - do nothing
    if (selectUrine && selectEswab) {
      toast({
        title: "Error",
        description: "Please select only one sample type (Urine or ESwab)",
        variant: "destructive",
      });
      return;
    }

    // Case: Neither selected - do nothing
    if (!selectUrine && !selectEswab) {
      toast({
        title: "Error",
        description: "Please select a sample type first (Urine or ESwab)",
        variant: "destructive",
      });
      return;
    }

    // Case: Tree running and workflow active - do nothing
    if (treeState && workflowState) {
      toast({
        title: "Info",
        description: "Workflow is already running",
      });
      return;
    }

    setIsLoading(true);

    try {
      // If tree is not running, start it first
      if (!treeState) {
        toast({
          title: "Info",
          description: "Starting tree...",
        });

        const treeResult = await startTree();
        if (treeResult.error) {
          toast({
            title: "Error",
            description: `Failed to start tree: ${treeResult.error}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Wait for tree_state to become true (with timeout)
        const maxWaitTime = 30000; // 30 seconds timeout
        const startTime = Date.now();
        let treeStarted = false;

        while (Date.now() - startTime < maxWaitTime) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { data } = await getTreeState();
          if (data?.tree_state) {
            setTreeState(true);
            treeStarted = true;
            break;
          }
        }

        if (!treeStarted) {
          toast({
            title: "Error",
            description: "Tree failed to start within timeout period",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Success",
          description: "Tree started successfully",
        });
      }

      // Now tree is running, make the appropriate API call based on selection
      if (selectUrine) {
        const urineResult = await urineWorkflow();
        if (urineResult.error) {
          toast({
            title: "Error",
            description: `Failed to set urine workflow: ${urineResult.error}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else if (selectEswab) {
        const eswabResult = await eswabWorkflow();
        if (eswabResult.error) {
          toast({
            title: "Error",
            description: `Failed to set eSwab workflow: ${eswabResult.error}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Start the workflow
      const { error } = await startWorkflow();

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setWorkflowState(true);
      toast({
        title: "Success",
        description: "Archiving started successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to start workflow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancel = async () => {
    setIsLoading(true);
    try {
      const { error } = await cancelWorkflow();

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setWorkflowState(false);
      toast({
        title: "Success",
        description: "Archiving paused",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to pause workflow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resume = async () => {
    setIsLoading(true);
    try {
      const { error } = await resumeWorkflow();

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setWorkflowState(true);
      toast({
        title: "Success",
        description: "Archiving resumed",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resume workflow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectUrine = async () => {
    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot select sample type: Tree must be running and workflow must be inactive",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Set states
      setSelectUrine(true);
      setSelectEswab(false);

      // Make API call
      const { error } = await urineWorkflow();

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
        description: "Urine workflow selected",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to select urine workflow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectEswab = async () => {
    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot select sample type: Tree must be running and workflow must be inactive",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Set states
      setSelectUrine(false);
      setSelectEswab(true);

      // Make API call
      const { error } = await eswabWorkflow();

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
        description: "ESwab workflow selected",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to select eSwab workflow",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    workflowState,
  };
}
