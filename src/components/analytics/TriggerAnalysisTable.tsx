
import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
  category: string;
  description: string;
  whyExplanation: string;
  relatedTriggers?: string[];
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
            <TableHead>Trigger Category</TableHead>
            <TableHead>Why This Happens</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>%</TableHead>
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
                    <div>
                      <div className="font-semibold">{trigger.trigger}</div>
                      {trigger.relatedTriggers && trigger.relatedTriggers.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Related: {trigger.relatedTriggers.slice(0, 3).join(', ')}
                          {trigger.relatedTriggers.length > 3 && ` +${trigger.relatedTriggers.length - 3} more`}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 max-w-md">
                  <div className="space-y-2">
                    <div className="whitespace-pre-line font-mono text-xs leading-relaxed bg-gray-50 p-3 rounded border">
                      {trigger.whyExplanation}
                    </div>
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
