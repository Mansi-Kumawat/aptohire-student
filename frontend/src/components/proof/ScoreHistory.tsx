import React, { useState } from 'react';
import { SkillScoreHistory } from '@/lib/domain/types';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Table as TableIcon, LineChart as ChartIcon } from 'lucide-react';

interface ScoreHistoryProps {
  history: SkillScoreHistory[];
  skillName: string;
  passMark?: number;
  className?: string;
}

export const ScoreHistory: React.FC<ScoreHistoryProps> = ({
  history,
  skillName,
  passMark = 50,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  if (history.length < 2) {
    return (
      <div className="p-6 border border-hairline rounded-panel bg-canvas text-center">
        <p className="text-[14px] text-moss">
          Your history appears after your second review.
        </p>
      </div>
    );
  }

  const chartData = history.map((item, index) => ({
    name: `Review ${index + 1}`,
    score: item.score,
    date: formatDate(item.created_at),
  }));

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-base text-ink">Score history</h3>
          <p className="text-xs text-moss">{skillName} verified trajectory</p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
          className="text-xs h-[32px] gap-1.5"
        >
          {viewMode === 'chart' ? (
            <>
              <TableIcon className="w-3.5 h-3.5" />
              <span>View as table</span>
            </>
          ) : (
            <>
              <ChartIcon className="w-3.5 h-3.5" />
              <span>View as chart</span>
            </>
          )}
        </Button>
      </div>

      {viewMode === 'chart' ? (
        <div className="h-48 w-full border border-hairline rounded-panel p-4 bg-canvas">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5B6A62' }} stroke="#E3E8E5" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#5B6A62' }} stroke="#E3E8E5" />
              <ReferenceLine y={passMark} stroke="#FF7A1A" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E3E8E5',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(23,38,30,0.08)',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0E9F5B"
                strokeWidth={2.5}
                dot={{ fill: '#0E9F5B', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#0B7F49' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">Review {idx + 1}</TableCell>
                <TableCell className="text-moss">{formatDate(item.created_at)}</TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {item.score}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
