import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { ComposedChart, Scatter, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLiftContext } from '../context/LiftContext';

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


const TooltipValue = styled.span`
  font-weight: 600;
  color: #2d3748;
`;

interface SetDataPoint {
  exercise: string;
  weight: number;
  reps: number;
  date: string;
  dateValue: number;
  setDescription: string;
  isParetoFrontier?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: SetDataPoint;
    dataKey?: string;
    name?: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Find the scatter plot data (ignore frontier line data and extended points)
  // Prioritize scatter data by looking for payload with dataKey other than 'weight'
  const scatterPayload = payload.find(p => 
    p.payload && 
    p.payload.exercise && 
    p.payload.setDescription && 
    !p.payload.setDescription.includes('(extended)') &&
    (p.dataKey !== 'weight' || !p.name || p.name.includes(' Frontier') === false)
  ) || payload.find(p => 
    p.payload && 
    p.payload.exercise && 
    p.payload.setDescription && 
    !p.payload.setDescription.includes('(extended)')
  );
  
  if (!scatterPayload || !scatterPayload.payload) {
    return null;
  }

  const data = scatterPayload.payload;
  const formattedDate = new Date(data.dateValue).toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: '2-digit' 
  });

  return (
    <CustomTooltipContainer>
      <TooltipLabel>{formattedDate}</TooltipLabel>
      <TooltipEntry>
        <div>
          <TooltipValue>{data.exercise}: {data.setDescription}</TooltipValue>
        </div>
      </TooltipEntry>
    </CustomTooltipContainer>
  );
};

// Calculate Pareto frontier for efficiency curve
// A point is included only if no other point dominates it via:
// (a) same reps, higher weight OR (b) same weight, higher reps
const calculateParetoFrontier = (points: SetDataPoint[]): SetDataPoint[] => {
  if (points.length === 0) return [];
  
  // Filter points: include only if not dominated
  const paretoPoints = points.filter(candidate => {
    // Check if this point is dominated by any other point
    return !points.some(other => 
      other !== candidate && (
        (other.reps === candidate.reps && other.weight > candidate.weight) ||
        (other.weight === candidate.weight && other.reps > candidate.reps)
      )
    );
  });
  
  // Sort by reps ascending to ensure curve goes left to right (low reps to high reps)
  const sortedPoints = paretoPoints.sort((a, b) => a.reps - b.reps);
  
  if (sortedPoints.length === 0) return [];
  
  // Extend the frontier to connect with axes
  const extendedPoints: SetDataPoint[] = [];
  
  // Add horizontal line to Y-axis from the leftmost point (highest weight point)
  const leftmostPoint = sortedPoints[0];
  extendedPoints.push({
    ...leftmostPoint,
    reps: 0, // Extend horizontally to Y-axis (reps = 0)
    setDescription: `${leftmostPoint.weight}lb x 0 (extended)`
  });
  
  // Add all original frontier points
  extendedPoints.push(...sortedPoints);
  
  // Add vertical line to X-axis from the rightmost point (highest reps point)
  const rightmostPoint = sortedPoints[sortedPoints.length - 1];
  extendedPoints.push({
    ...rightmostPoint,
    weight: 0, // Extend vertically to X-axis (weight = 0)
    setDescription: `0lb x ${rightmostPoint.reps} (extended)`
  });
  
  return extendedPoints;
};

const ParetoChart: React.FC = () => {
  const { lifts, searchTerm } = useLiftContext();
  const [timeRange, setTimeRange] = useState<number>(30);

  const { scatterData, frontierData, exercises } = useMemo(() => {
    if (lifts.length === 0) return { scatterData: [], frontierData: {}, exercises: [] };

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

    if (filteredLifts.length === 0) return { scatterData: [], frontierData: {}, exercises: [] };

    // Create scatter plot data points for all sets
    const allSets: SetDataPoint[] = [];
    const exerciseSet = new Set<string>();

    filteredLifts.forEach(lift => {
      exerciseSet.add(lift.exercise);
      lift.sets.forEach(set => {
        allSets.push({
          exercise: lift.exercise,
          weight: set.weight,
          reps: set.reps,
          date: lift.date,
          dateValue: new Date(lift.date).getTime(),
          setDescription: `${set.weight}lb x ${set.reps}`
        });
      });
    });

    const exerciseArray = Array.from(exerciseSet);
    
    // Calculate Pareto frontier for each exercise
    const frontierLines: { [exercise: string]: SetDataPoint[] } = {};
    
    exerciseArray.forEach(exercise => {
      const exerciseSets = allSets.filter(set => set.exercise === exercise);
      frontierLines[exercise] = calculateParetoFrontier(exerciseSets);
    });

    return {
      scatterData: allSets,
      frontierData: frontierLines,
      exercises: exerciseArray
    };
  }, [lifts, searchTerm, timeRange]);

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  if (scatterData.length === 0) {
    const isSearching = searchTerm.trim().length > 0;
    
    return (
      <Container>
        <HeaderContainer>
          <Title>Weight/Reps Pareto Frontier</Title>
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
              <p>Add some lifts to see your volume vs weight analysis!</p>
            </>
          )}
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderContainer>
        <Title>Weight/Reps Pareto Frontier</Title>
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
          <ComposedChart 
            margin={{ top: 25, right: 35, left: 80, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="reps"
              type="number"
              tick={{ fontSize: 12 }}
              label={{ value: 'Reps', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="weight"
              type="number"
              label={{ value: 'Weight', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '30px' }}
            />
            
            {/* Pareto frontier lines for each exercise - render first (behind scatter points) */}
            {exercises.map((exercise, index) => {
              const frontier = frontierData[exercise] || [];
              if (frontier.length < 2) return null;
              
              return (
                <Line
                  key={`frontier-${exercise}`}
                  type="linear"
                  dataKey="weight"
                  data={frontier}
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  dot={false}
                  connectNulls={false}
                  legendType="none"
                  isAnimationActive={false}
                  activeDot={false}
                  tooltipType="none"
                />
              );
            })}
            
            {/* Scatter plots for each exercise - render on top */}
            {exercises.map((exercise, index) => {
              const exerciseData = scatterData.filter(d => d.exercise === exercise);
              return (
                <Scatter
                  key={`scatter-${exercise}`}
                  name={exercise}
                  data={exerciseData}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                  r={4}
                  activeShape={{ r: 8, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Container>
  );
};

export default ParetoChart;