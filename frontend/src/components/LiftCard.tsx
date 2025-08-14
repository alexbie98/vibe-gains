import React, { useState } from 'react';
import styled from 'styled-components';
import { Lift } from '../types';
import { useLiftContext } from '../context/LiftContext';

const Card = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 10px;
  border-left: 4px solid #667eea;
  position: relative;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 15px;
`;

const LiftNameContainer = styled.div`
  display: flex;
  align-items: center;
  flex: none;
`;

const PRBadge = styled.span`
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: #8B4513;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 12px;
  margin-left: 6px;
  margin-right: 4px;
  box-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
`;

const DeleteButton = styled.button`
  background: #fc8181;
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: all 0.2s ease;

  &:hover {
    background: #f56565;
    opacity: 1;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    background: #cbd5e0;
    cursor: not-allowed;
    transform: none;
  }
`;

const LiftName = styled.div`
  font-weight: bold;
  color: #2d3748;
  flex: 1;
`;

const Sets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const SetInfo = styled.span`
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
`;

const LiftDate = styled.div`
  font-size: 0.8rem;
  color: #718096;
`;

interface LiftCardProps {
  lift: Lift;
}

const LiftCard: React.FC<LiftCardProps> = ({ lift }) => {
  const { deleteLift } = useLiftContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const maxWeight = Math.max(...lift.sets.map(set => set.weight));
  const totalVolume = lift.sets.reduce((total, set) => total + (set.weight * set.reps), 0);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${lift.exercise} lift?`)) {
      try {
        setIsDeleting(true);
        await deleteLift(lift.id);
      } catch (error) {
        console.error('Failed to delete lift:', error);
        alert('Failed to delete lift. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <LiftNameContainer>
          <LiftName>{lift.exercise}</LiftName>
          {lift.isPersonalRecord && <PRBadge>⭐ PR!</PRBadge>}
        </LiftNameContainer>
        <DeleteButton 
          onClick={handleDelete} 
          disabled={isDeleting}
          title="Delete lift"
        >
          ×
        </DeleteButton>
      </CardHeader>
      <Sets>
        {lift.sets.map((set, index) => (
          <SetInfo key={index}>
            {set.weight}lbs × {set.reps}
          </SetInfo>
        ))}
      </Sets>
      <LiftDate>
        {lift.date} • Max: {maxWeight}lbs • Volume: {totalVolume}lbs
      </LiftDate>
    </Card>
  );
};

export default LiftCard;