import { useState } from 'react';
import { startWorkflow, cancelWorkflow, resumeWorkflow } from '@/services/fastapi';
import { useToast } from '@/hooks/use-toast';

interface UseWorkflowReturn {
  isLoading: boolean;
  start: () => Promise<void>;
  cancel: () => Promise<void>;
  resume: () => Promise<void>;
}

export function useWorkflow(): UseWorkflowReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const start = async () => {
    setIsLoading(true);
    try {
      const { error } = await startWorkflow();
      
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

  return {
    isLoading,
    start,
    cancel,
    resume,
  };
}
