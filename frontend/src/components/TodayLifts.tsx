import React from 'react';
import styled from 'styled-components';
import { useLiftContext } from '../context/LiftContext';
import LiftCard from './LiftCard';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  height: fit-content;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  color: #4a5568;
  font-size: 1.4rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #718096;
  padding: 40px 20px;

  p {
    margin-bottom: 10px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #718096;
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
`;

const TodayLifts: React.FC = () => {
  const context = useLiftContext() as any;
  const { lifts, loading, error, today } = context;
  const todayLifts = lifts.filter((lift: any) => lift.date === today);
  

  return (
    <Container>
      <Title>Today's Progress</Title>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? (
        <LoadingSpinner>Loading lifts...</LoadingSpinner>
      ) : todayLifts.length === 0 ? (
        <EmptyState>
          <p>No lifts recorded today</p>
          <p>Click the + button to add your first lift!</p>
        </EmptyState>
      ) : (
        todayLifts.map((lift: any) => (
          <LiftCard key={lift.id} lift={lift} />
        ))
      )}
    </Container>
  );
};

export default TodayLifts;