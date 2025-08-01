
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Brain, AlertTriangle, Target, Lightbulb } from 'lucide-react';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  if (triggerData.length === 0) {
    return null;
  }

  const toggleRow = (trigger: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(trigger)) {
      newExpanded.delete(trigger);
    } else {
      newExpanded.add(trigger);
    }
    setExpandedRows(newExpanded);
  };

  const parseWhyExplanation = (explanation: string) => {
    const sections = {
      underlying: '',
      patterns: '',
      cognitive: '',
      recommendations: ''
    };

    // Parse the structured explanation
    const lines = explanation.split('\n').filter(line => line.trim());
    let currentSection = '';

    lines.forEach(line => {
      if (line.includes('UNDERLYING FACTORS:') || line.includes('Underlying psychological factors:')) {
        currentSection = 'underlying';
      } else if (line.includes('PATTERNS:') || line.includes('Escalation patterns:')) {
        currentSection = 'patterns';
      } else if (line.includes('COGNITIVE:') || line.includes('Cognitive distortions:')) {
        currentSection = 'cognitive';
      } else if (line.includes('RECOMMENDATIONS:') || line.includes('Therapeutic recommendations:')) {
        currentSection = 'recommendations';
      } else if (currentSection && line.trim() && !line.includes(':')) {
        sections[currentSection as keyof typeof sections] += line.trim() + ' ';
      }
    });

    return sections;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Brain className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Clinical Trigger Analysis</h3>
          <p className="text-sm text-gray-600">Deep psychological insights into anxiety patterns</p>
        </div>
      </div>

      <div className="space-y-4">
        {triggerData
          .sort((a, b) => b.count - a.count)
          .map((trigger) => {
            const isExpanded = expandedRows.has(trigger.trigger);
            const sections = parseWhyExplanation(trigger.whyExplanation);
            const riskLevel = trigger.avgSeverity >= 7 ? 'high' : trigger.avgSeverity >= 5 ? 'moderate' : 'low';
            
            return (
              <Card key={trigger.trigger} className="border border-gray-200 hover:shadow-md transition-all duration-200">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="w-full p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => toggleRow(trigger.trigger)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Trigger Info */}
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-md" 
                              style={{ backgroundColor: trigger.color }}
                            />
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{trigger.trigger}</h4>
                              <p className="text-sm text-gray-600">{trigger.description}</p>
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-6 ml-auto mr-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{trigger.count}</div>
                              <div className="text-xs text-gray-500">episodes</div>
                            </div>
                            
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                riskLevel === 'high' ? 'text-red-600' : 
                                riskLevel === 'moderate' ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {trigger.avgSeverity.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">severity</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">
                                {((trigger.count / totalEntries) * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-gray-500">frequency</div>
                            </div>

                            <Badge variant={riskLevel === 'high' ? 'destructive' : riskLevel === 'moderate' ? 'secondary' : 'outline'}>
                              {riskLevel} risk
                            </Badge>
                          </div>
                        </div>

                        {/* Expand Icon */}
                        <div className="flex items-center">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50">
                      <div className="pt-4 space-y-4">
                        {/* Clinical Insights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Underlying Factors */}
                          {sections.underlying && (
                            <Card className="p-4 bg-white border-l-4 border-l-blue-500">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <Brain className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">Underlying Psychology</h5>
                                  <p className="text-sm text-gray-700 leading-relaxed">{sections.underlying}</p>
                                </div>
                              </div>
                            </Card>
                          )}

                          {/* Cognitive Patterns */}
                          {sections.cognitive && (
                            <Card className="p-4 bg-white border-l-4 border-l-orange-500">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">Cognitive Distortions</h5>
                                  <p className="text-sm text-gray-700 leading-relaxed">{sections.cognitive}</p>
                                </div>
                              </div>
                            </Card>
                          )}

                          {/* Escalation Patterns */}
                          {sections.patterns && (
                            <Card className="p-4 bg-white border-l-4 border-l-purple-500">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                  <Target className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">Escalation Patterns</h5>
                                  <p className="text-sm text-gray-700 leading-relaxed">{sections.patterns}</p>
                                </div>
                              </div>
                            </Card>
                          )}

                          {/* Treatment Recommendations */}
                          {sections.recommendations && (
                            <Card className="p-4 bg-white border-l-4 border-l-green-500">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 rounded-lg">
                                  <Lightbulb className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">Treatment Focus</h5>
                                  <p className="text-sm text-gray-700 leading-relaxed">{sections.recommendations}</p>
                                </div>
                              </div>
                            </Card>
                          )}
                        </div>

                        {/* Related Triggers */}
                        {trigger.relatedTriggers && trigger.relatedTriggers.length > 0 && (
                          <Card className="p-4 bg-white">
                            <h5 className="font-semibold text-gray-900 mb-3">Related Anxiety Triggers</h5>
                            <div className="flex flex-wrap gap-2">
                              {trigger.relatedTriggers.slice(0, 6).map((related, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {related}
                                </Badge>
                              ))}
                              {trigger.relatedTriggers.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{trigger.relatedTriggers.length - 6} more
                                </Badge>
                              )}
                            </div>
                          </Card>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
      </div>
    </Card>
  );
};

export default TriggerAnalysisTable;
