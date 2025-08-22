import React from 'react';
import styled from 'styled-components';
import TodayLifts from './TodayLifts';
import ProgressChart from './ProgressChart';
import ParetoChart from './ParetoChart';
import BodyWeightChart from './BodyWeightChart';
import LiftHistory from './LiftHistory';

const DashboardGrid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  margin-bottom: 100px; // Space for floating add button

  @media (min-width: 768px) {
    grid-template-columns: 35fr 65fr;
    grid-template-areas: 
      "sidebar charts"
      "sidebar charts";
  }

  @media (min-width: 1024px) {
    grid-template-areas: 
      "sidebar charts"
      "sidebar charts";
  }
`;

const SidebarSection = styled.div`
  grid-area: sidebar;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ChartsSection = styled.div`
  grid-area: charts;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Dashboard: React.FC = () => {
  return (
    <DashboardGrid>
      <SidebarSection>
        <TodayLifts />
        <LiftHistory />
      </SidebarSection>
      <ChartsSection>
        <ProgressChart />
        <ParetoChart />
        <BodyWeightChart />
      </ChartsSection>
    </DashboardGrid>
  );
};

export default Dashboard;