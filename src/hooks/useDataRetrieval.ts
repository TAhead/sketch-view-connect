export function useDataRetrieval() {
  const [data, setData] = useState<SystemData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Poll only critical real-time data
  useEffect(() => {
    const pollData = async () => {
      setIsLoading(true);
      try {
        const [sampleCount, errorInfo, backButtonState] = await Promise.all([getSampleCount(), getErrorInfo()]);

        setData((prev) => ({
          ...prev,
          sample_count: sampleCount.data?.sample_count,
          error_info: errorInfo.data,
        }));
      } catch (err) {
        console.error("Polling error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(pollData, 10000);
    pollData(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  // Fetch static data once
  useEffect(() => {
    const fetchStaticData = async () => {
      const [rackInfo, backButtonState] = await Promise.all([getRackIds(), getBackButtonState()]);

      setData((prev) => ({
        ...prev,
        rack_info: rackInfo.data?.rack_ids,
        back_button_state: backButtonState.data?.enabled,
      }));
    };

    fetchStaticData();
  }, []);

  return { data, isLoading };
}
