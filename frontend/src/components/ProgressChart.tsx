import React, { useMemo } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLiftContext } from '../context/LiftContext';
import { ChartDataPoint } from '../types';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  height: 400px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: #4a5568;
  font-size: 1.4rem;
`;

const ChartContainer = styled.div`
  height: 400px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #718096;
  padding: 40px 20px;
  height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  p {
    margin-bottom: 10px;
  }
`;


const ProgressChart: React.FC = () => {
  const { lifts, searchTerm } = useLiftContext();

  const chartData = useMemo(() => {
    if (lifts.length === 0) return [];

    // Filter lifts based on search term
    const filteredLifts = searchTerm.trim() 
      ? lifts.filter(lift => lift.exercise.toLowerCase().includes(searchTerm.toLowerCase()))
      : lifts;

    if (filteredLifts.length === 0) return [];

    const exerciseData: { [date: string]: { [exercise: string]: { weight: number; isPR: boolean } } } = {};
    const exercises = new Set<string>();

    filteredLifts.forEach(lift => {
      const date = lift.date;
      const maxWeight = lift.maxWeight || Math.max(...lift.sets.map(set => set.weight));
      
      exercises.add(lift.exercise);
      
      if (!exerciseData[date]) {
        exerciseData[date] = {};
      }
      
      if (!exerciseData[date][lift.exercise] || exerciseData[date][lift.exercise].weight < maxWeight) {
        exerciseData[date][lift.exercise] = {
          weight: maxWeight,
          isPR: lift.isPersonalRecord || false
        };
      }
    });

    const sortedDates = Object.keys(exerciseData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedDates.map(date => {
      const dataPoint: ChartDataPoint = { date };
      exercises.forEach(exercise => {
        // Only include data if exercise was performed on this date
        if (exerciseData[date][exercise]) {
          dataPoint[exercise] = exerciseData[date][exercise].weight;
          // Store PR info for custom dot rendering
          dataPoint[`${exercise}_isPR`] = exerciseData[date][exercise].isPR;
        }
        // If exercise wasn't performed on this date, don't include it (undefined)
        // This prevents lines from dropping to 0
      });
      return dataPoint;
    });
  }, [lifts, searchTerm]);

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
  ];

  const exercises = useMemo(() => {
    const filteredLifts = searchTerm.trim() 
      ? lifts.filter(lift => lift.exercise.toLowerCase().includes(searchTerm.toLowerCase()))
      : lifts;
    
    const exerciseSet = new Set<string>();
    filteredLifts.forEach(lift => exerciseSet.add(lift.exercise));
    return Array.from(exerciseSet);
  }, [lifts, searchTerm]);

  if (chartData.length === 0) {
    const isSearching = searchTerm.trim().length > 0;
    
    return (
      <Container>
        <Title>Max Weight Progress</Title>
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
      <Title>Max Weight Progress</Title>
      <ChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 25, right: 35, left: 70, bottom: 120 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={55}
            />
            <YAxis 
              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              width={60}
            />
            <Tooltip />
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