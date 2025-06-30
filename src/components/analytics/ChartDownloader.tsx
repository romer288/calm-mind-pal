
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChartDownloaderProps {
  chartData: any;
  chartType: string;
  fileName: string;
}

const ChartDownloader: React.FC<ChartDownloaderProps> = ({ 
  chartData, 
  chartType, 
  fileName 
}) => {
  const { toast } = useToast();

  const downloadChart = () => {
    try {
      // Convert chart data to downloadable format
      const chartInfo = {
        type: chartType,
        data: chartData,
        generatedAt: new Date().toISOString(),
        title: fileName
      };

      const blob = new Blob([JSON.stringify(chartInfo, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Chart Downloaded",
        description: `${fileName} has been downloaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download chart data.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={downloadChart}
      className="flex items-center gap-1"
    >
      <Download className="w-3 h-3" />
      Download
    </Button>
  );
};

export default ChartDownloader;
