import React, { useMemo } from 'react';
import styled from 'styled-components';
import { FixedSizeList as List } from 'react-window';
import { useLiftContext } from '../context/LiftContext';
import LiftCard from './LiftCard';
import { Lift } from '../types';

const Container = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
  height: 400px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
`;

const Title = styled.h2`
  margin: 0;
  color: #4a5568;
  font-size: 1.4rem;
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 250px;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &::placeholder {
    color: #a0aec0;
  }
`;

const SearchStats = styled.div`
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 10px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #718096;
  padding: 40px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;

  p {
    margin-bottom: 10px;
  }
`;

const ListContainer = styled.div`
  flex: 1;
  overflow: hidden;
`;

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: Lift[];
}

const Row: React.FC<RowProps> = ({ index, style, data }) => (
  <div style={style}>
    <LiftCard lift={data[index]} />
  </div>
);

const LiftHistory: React.FC = () => {
  const { lifts, searchTerm, setSearchTerm } = useLiftContext();
  
  const filteredAndSortedLifts = useMemo(() => {
    let filtered = lifts;
    
    if (searchTerm.trim()) {
      filtered = lifts.filter(lift => 
        lift.exercise.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const sorted = [...filtered].sort((a, b) => {
      // Sort by date first (most recent first), then by timestamp for same-day lifts
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Most recent date first
      }
      // If same date, sort by timestamp (most recent first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return sorted;
  }, [lifts, searchTerm]);

  const showEmptyState = filteredAndSortedLifts.length === 0;
  const isSearching = searchTerm.trim().length > 0;
  
  return (
    <Container>
      <Header>
        <Title>All Lifts</Title>
        <SearchInput
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Header>
      
      {isSearching && (
        <SearchStats>
          {filteredAndSortedLifts.length} of {lifts.length} lifts match "{searchTerm}"
        </SearchStats>
      )}
      
      {showEmptyState ? (
        <EmptyState>
          {isSearching ? (
            <>
              <p>No lifts found for "{searchTerm}"</p>
              <p>Try a different search term</p>
            </>
          ) : (
            <>
              <p>No lifts recorded yet</p>
              <p>Start tracking your progress!</p>
            </>
          )}
        </EmptyState>
      ) : (
        <ListContainer>
          <List
            height={300}
            width="100%"
            itemCount={filteredAndSortedLifts.length}
            itemSize={100}
            itemData={filteredAndSortedLifts}
            overscanCount={5}
          >
            {Row}
          </List>
        </ListContainer>
      )}
    </Container>
  );
};

export default LiftHistory;