
import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
}

interface TriggerAnalysisTableProps {
  triggerData: TriggerData[];
  totalEntries: number;
}

const TriggerAnalysisTable: React.FC<TriggerAnalysisTableProps> = ({
  triggerData,
  totalEntries
}) => {
  if (triggerData.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Trigger Analysis</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trigger Type</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Average Severity</TableHead>
            <TableHead>Percentage of Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {triggerData
            .sort((a, b) => b.count - a.count)
            .map((trigger) => (
              <TableRow key={trigger.trigger}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: trigger.color }}
                    />
                    {trigger.trigger}
                  </div>
                </TableCell>
                <TableCell>{trigger.count} times</TableCell>
                <TableCell>
                  <span className={`font-medium ${
                    trigger.avgSeverity >= 7 ? 'text-red-600' : 
                    trigger.avgSeverity >= 5 ? 'text-orange-600' : 'text-green-600'
                  }`}>
                    {trigger.avgSeverity.toFixed(1)}/10
                  </span>
                </TableCell>
                <TableCell>{((trigger.count / totalEntries) * 100).toFixed(1)}%</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default TriggerAnalysisTable;
