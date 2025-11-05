import { useState, useEffect } from "react";
import {
  startWorkflow,
  cancelWorkflow,
  resumeWorkflow,
  urineWorkflow,
  eswabWorkflow,
  getTreeState,
  startTree,
  getWorkflowState,
  getSampleType,
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

  // Fetch sample type and update button states
  const fetchSampleType = async () => {
    const result = await getSampleType();
    console.log('Sample Type Response:', result.data?.sample_type);
    
    // Check if sample_type is a string (valid response) and not an error object
    if (result.data?.sample_type && typeof result.data.sample_type === 'string') {
      if (result.data.sample_type === "ldh_urine_sample_archiving") {
        setSelectUrine(true);
        setSelectEswab(false);
      } else if (result.data.sample_type === "ldh_eswab_sample_archiving") {
        setSelectUrine(false);
        setSelectEswab(true);
      } else {
        setSelectUrine(false);
        setSelectEswab(false);
      }
    } else {
      // If error object or invalid response, reset selection
      setSelectUrine(false);
      setSelectEswab(false);
    }
  };

  // Sync sample type buttons with tree state
  useEffect(() => {
    if (treeState) {
      // When tree is online, fetch the current sample type
      fetchSampleType();
    } else {
      // When tree is offline, reset button states
      setSelectUrine(false);
      setSelectEswab(false);
    }
  }, [treeState]);

  // Poll tree state and workflow state
  useEffect(() => {
    const pollStatus = async () => {
      // Fetch both states concurrently
      const [treeResult, workflowResult] = await Promise.all([getTreeState(), getWorkflowState()]);

      // Update tree state - check if it's a boolean, not an error object
      if (treeResult.error) {
        setTreeState(false);
      } else if (treeResult.data?.tree_state !== undefined && typeof treeResult.data.tree_state === 'boolean') {
        setTreeState(treeResult.data.tree_state);
      } else {
        // If it's an error object or invalid response, set to false
        setTreeState(false);
      }

      // Update workflow state - check if it's a boolean, not an error object
      if (workflowResult.error) {
        setWorkflowState(false);
      } else if (workflowResult.data?.workflow_state !== undefined && typeof workflowResult.data.workflow_state === 'boolean') {
        setWorkflowState(workflowResult.data.workflow_state);
      } else {
        // If it's an error object or invalid response, set to false
        setWorkflowState(false);
      }
    };

    pollStatus(); // Run once immediately
    const interval = setInterval(pollStatus, 2000); // Repeat every 2 seconds
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
      // If tree is not running, show an error and return
      if (!treeState) {
        toast({
          title: "Error",
          description: "Tree is not running. Please start the tree before starting the workflow.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
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
    if (!treeState) {
      toast({
        title: "Error",
        description: "Cannot select sample type: Tree must be running",
        variant: "destructive",
      });
      return;
    }

    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot select sample type: Workflow must be inactive",
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

      // Fetch sample type after successful selection
      await fetchSampleType();
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
    if (!treeState) {
      toast({
        title: "Error",
        description: "Cannot select sample type: Tree must be running",
        variant: "destructive",
      });
      return;
    }

    if (workflowState) {
      toast({
        title: "Error",
        description: "Cannot select sample type: Workflow must be inactive",
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

      // Fetch sample type after successful selection
      await fetchSampleType();
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
  };
}
