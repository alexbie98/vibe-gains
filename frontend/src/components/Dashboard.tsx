import React from 'react';
import styled from 'styled-components';
import TodayLifts from './TodayLifts';
import ProgressChart from './ProgressChart';
import LiftHistory from './LiftHistory';

const DashboardGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  margin-bottom: 100px; // Space for floating add button

  @media (min-width: 768px) {
    grid-template-columns: 35fr 65fr;
    grid-template-areas: 
      "today chart"
      "history history";
  }

  @media (min-width: 1024px) {
    grid-template-areas: 
      "today chart"
      "history chart";
  }
`;

const TodaySection = styled.div`
  grid-area: today;
`;

const ChartSection = styled.div`
  grid-area: chart;
`;

const HistorySection = styled.div`
  grid-area: history;
`;

const Dashboard: React.FC = () => {
  return (
    <DashboardGrid>
      <TodaySection>
        <TodayLifts />
      </TodaySection>
      <ChartSection>
        <ProgressChart />
      </ChartSection>
      <HistorySection>
        <LiftHistory />
      </HistorySection>
    </DashboardGrid>
  );
};

export default Dashboard;