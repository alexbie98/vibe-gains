import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLiftContext } from '../context/LiftContext';
import { ChartDataPoint } from '../types';
import { findMaxOneRepMaxSet } from '../utils/oneRepMax';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  height: 500px;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
`;

const Title = styled.h2`
  margin: 0;
  color: #4a5568;
  font-size: 1.4rem;
`;

const TimeRangeSelector = styled.select`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const ChartContainer = styled.div`
  height: 500px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #718096;
  padding: 40px 20px;
  height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  p {
    margin-bottom: 10px;
  }
`;

const CustomTooltipContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
`;

const TooltipLabel = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: #2d3748;
`;

const TooltipEntry = styled.div`
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TooltipColor = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${props => props.color};
`;

const TooltipValue = styled.span`
  font-weight: 600;
  color: #2d3748;
`;

const TooltipSet = styled.span`
  color: #718096;
  font-size: 12px;
  margin-left: 4px;
`;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    payload?: any;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Format the label from unix timestamp to readable date
  const formattedDate = typeof label === 'number' 
    ? new Date(label).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: '2-digit' 
      })
    : label;

  return (
    <CustomTooltipContainer>
      <TooltipLabel>{formattedDate}</TooltipLabel>
      {payload.map((entry, index) => {
        const exercise = entry.dataKey;
        const oneRepMax = entry.value;
        const setInfo = entry.payload?.[`${exercise}_set`];
        
        return (
          <TooltipEntry key={index}>
            <TooltipColor color={entry.color} />
            <div>
              <TooltipValue>{exercise}: {oneRepMax} lbs</TooltipValue>
              {setInfo && (
                <TooltipSet>({setInfo})</TooltipSet>
              )}
            </div>
          </TooltipEntry>
        );
      })}
    </CustomTooltipContainer>
  );
};


const ProgressChart: React.FC = () => {
  const { lifts, searchTerm } = useLiftContext();
  const [timeRange, setTimeRange] = useState<number>(30); // Default to last 30 days

  const chartData = useMemo(() => {
    if (lifts.length === 0) return [];

    // Filter lifts based on search term
    let filteredLifts = searchTerm.trim() 
      ? lifts.filter(lift => lift.exercise.toLowerCase().includes(searchTerm.toLowerCase()))
      : lifts;
    
    // Filter by time range (if not "All time")
    if (timeRange !== -1) {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000));
      
      filteredLifts = filteredLifts.filter(lift => {
        const liftDate = new Date(lift.date);
        return liftDate >= cutoffDate;
      });
    }

    if (filteredLifts.length === 0) return [];

    const exerciseData: { [date: string]: { [exercise: string]: { oneRepMax: number; isPR: boolean; bestSet: { weight: number; reps: number } | null } } } = {};
    const exercises = new Set<string>();

    filteredLifts.forEach(lift => {
      const date = lift.date;
      const { maxOneRepMax, bestSet } = findMaxOneRepMaxSet(lift.sets);
      
      exercises.add(lift.exercise);
      
      if (!exerciseData[date]) {
        exerciseData[date] = {};
      }
      
      if (!exerciseData[date][lift.exercise] || exerciseData[date][lift.exercise].oneRepMax < maxOneRepMax) {
        exerciseData[date][lift.exercise] = {
          oneRepMax: maxOneRepMax,
          isPR: lift.isPersonalRecord || false,
          bestSet: bestSet
        };
      }
    });

    const sortedDates = Object.keys(exerciseData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedDates.map(date => {
      const dataPoint: ChartDataPoint = { 
        date,
        dateValue: new Date(date).getTime() // Add numeric date value for proper spacing
      };
      exercises.forEach(exercise => {
        // Only include data if exercise was performed on this date
        if (exerciseData[date][exercise]) {
          dataPoint[exercise] = Math.round(exerciseData[date][exercise].oneRepMax * 10) / 10; // Round to 1 decimal
          // Store PR info for custom dot rendering
          dataPoint[`${exercise}_isPR`] = exerciseData[date][exercise].isPR;
          // Store set info for tooltip
          const bestSet = exerciseData[date][exercise].bestSet;
          if (bestSet) {
            dataPoint[`${exercise}_set`] = `${bestSet.weight}x${bestSet.reps}`;
          }
        }
        // If exercise wasn't performed on this date, don't include it (undefined)
        // This prevents lines from dropping to 0
      });
      return dataPoint;
    });
  }, [lifts, searchTerm, timeRange]);

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  const exercises = useMemo(() => {
    let filteredLifts = searchTerm.trim() 
      ? lifts.filter(lift => lift.exercise.toLowerCase().includes(searchTerm.toLowerCase()))
      : lifts;
    
    // Filter by time range (if not "All time")
    if (timeRange !== -1) {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000));
      
      filteredLifts = filteredLifts.filter(lift => {
        const liftDate = new Date(lift.date);
        return liftDate >= cutoffDate;
      });
    }
    
    const exerciseSet = new Set<string>();
    filteredLifts.forEach(lift => exerciseSet.add(lift.exercise));
    return Array.from(exerciseSet);
  }, [lifts, searchTerm, timeRange]);

  if (chartData.length === 0) {
    const isSearching = searchTerm.trim().length > 0;
    
    return (
      <Container>
        <HeaderContainer>
          <Title>Estimated 1RM Progress</Title>
          <TimeRangeSelector 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 2 weeks</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 2 months</option>
            <option value={90}>Last 3 months</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
            <option value={-1}>All time</option>
          </TimeRangeSelector>
        </HeaderContainer>
        <EmptyState>
          {isSearching ? (
            <>
              <p>No data for "{searchTerm}"</p>
              <p>Try a different search term</p>
            </>
          ) : (
            <>
              <p>No data to display</p>
              <p>Add some lifts to see your progress!</p>
            </>
          )}
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderContainer>
        <Title>Estimated 1RM Progress</Title>
        <TimeRangeSelector 
          value={timeRange} 
          onChange={(e) => setTimeRange(Number(e.target.value))}
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 2 weeks</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 2 months</option>
          <option value={90}>Last 3 months</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last year</option>
          <option value={-1}>All time</option>
        </TimeRangeSelector>
      </HeaderContainer>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 25, right: 35, left: 100, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="dateValue"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={55}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                });
              }}
            />
            <YAxis 
              label={{ value: '1RM', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '30px' }}
              iconType="line"
            />
            {exercises.map((exercise, index) => (
              <Line
                key={exercise}
                type="linear"
                dataKey={exercise}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Container>
  );
};

export default ProgressChart;