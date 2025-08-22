import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BodyWeight } from '../types';
import { apiService } from '../services/api';
import AddBodyWeightModal from './AddBodyWeightModal';

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

const HeaderControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
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

const RecordButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
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
  border-radius: 50%;
  background-color: ${props => props.color};
`;

const TooltipValue = styled.span`
  font-weight: 600;
  color: #2d3748;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid white;
  background: #e53e3e;
  color: white;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    background: #c53030;
    transform: scale(1.1);
    z-index: 1001;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const DotContainer = styled.div`
  position: relative;
  
  &:hover ${DeleteButton} {
    opacity: 1;
  }
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
      {payload.map((entry, index) => (
        <TooltipEntry key={index}>
          <TooltipColor color={entry.color} />
          <TooltipValue>{entry.value} lbs</TooltipValue>
        </TooltipEntry>
      ))}
    </CustomTooltipContainer>
  );
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  onDelete: (id: string) => void;
}

const CustomDot: React.FC<CustomDotProps> = ({ cx, cy, payload, onDelete }) => {
  if (!cx || !cy || !payload) return null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm(`Delete body weight entry: ${payload.weight} lbs on ${payload.date}?`)) {
      onDelete(payload.id);
    }
  };

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="#667eea"
        stroke="#ffffff"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
      <foreignObject
        x={cx - 9}
        y={cy - 9}
        width={18}
        height={18}
        style={{ pointerEvents: 'auto' }}
      >
        <DeleteButton 
          onClick={handleDelete}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          ×
        </DeleteButton>
      </foreignObject>
    </g>
  );
};

const BodyWeightChart: React.FC = () => {
  const [bodyWeights, setBodyWeights] = useState<BodyWeight[]>([]);
  const [timeRange, setTimeRange] = useState<number>(90); // Default to last 90 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBodyWeights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBodyWeights();
      setBodyWeights(data);
    } catch (err) {
      console.error('Error fetching body weights:', err);
      setError('Failed to load body weight data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBodyWeights();
  }, []);

  const handleBodyWeightAdded = () => {
    fetchBodyWeights();
  };

  const handleDeleteBodyWeight = async (id: string) => {
    try {
      await apiService.deleteBodyWeight(id);
      fetchBodyWeights(); // Refresh the data
    } catch (error) {
      console.error('Failed to delete body weight:', error);
      alert('Failed to delete body weight. Please try again.');
    }
  };

  const chartData = useMemo(() => {
    if (bodyWeights.length === 0) return [];

    // Filter by time range (if not "All time")
    let filteredBodyWeights = bodyWeights;
    if (timeRange !== -1) {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (timeRange * 24 * 60 * 60 * 1000));
      
      filteredBodyWeights = bodyWeights.filter(bodyWeight => {
        const bodyWeightDate = new Date(bodyWeight.date);
        return bodyWeightDate >= cutoffDate;
      });
    }

    if (filteredBodyWeights.length === 0) return [];

    // Sort by date and create chart data
    const sortedByDate = [...filteredBodyWeights].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return sortedByDate.map(bodyWeight => ({
      id: bodyWeight.id,
      date: bodyWeight.date,
      weight: Math.round(bodyWeight.weight * 10) / 10, // Round to 1 decimal
      dateValue: new Date(bodyWeight.date).getTime()
    }));
  }, [bodyWeights, timeRange]);

  const renderContent = () => {
    if (loading) {
      return (
        <EmptyState>
          <p>Loading body weight data...</p>
        </EmptyState>
      );
    }

    if (error) {
      return (
        <EmptyState>
          <p>{error}</p>
          <p>Check console for details</p>
        </EmptyState>
      );
    }

    if (chartData.length === 0) {
      return (
        <EmptyState>
          <p>No body weight data to display</p>
          <p>Record your first body weight to see your progress!</p>
        </EmptyState>
      );
    }

    return (
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
              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '30px' }}
              iconType="line"
            />
            <Line
              type="linear"
              dataKey="weight"
              stroke="#667eea"
              strokeWidth={3}
              dot={(props) => <CustomDot {...props} onDelete={handleDeleteBodyWeight} />}
              connectNulls={false}
              name="Body Weight"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    );
  };

  return (
    <>
      <Container>
        <HeaderContainer>
          <Title>Body Weight Progress</Title>
          <HeaderControls>
            <RecordButton onClick={() => setIsModalOpen(true)}>
              Record Weight
            </RecordButton>
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
          </HeaderControls>
        </HeaderContainer>
        {renderContent()}
      </Container>
      
      <AddBodyWeightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBodyWeightAdded={handleBodyWeightAdded}
      />
    </>
  );
};

export default BodyWeightChart;