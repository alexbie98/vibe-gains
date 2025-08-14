import React, { useState } from 'react';
import { LiftProvider } from './context/LiftContext';
import Dashboard from './components/Dashboard';
import AddLiftModal from './components/AddLiftModal';
import { GlobalStyle, Container, Header, AddButton } from './styles/GlobalStyles';
import { Lift } from './types';

const App: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLift, setEditLift] = useState<Lift | null>(null);

  const handleEditLift = (lift: Lift) => {
    setEditLift(lift);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditLift(null);
  };

  return (
    <LiftProvider onEditLift={handleEditLift}>
      <GlobalStyle />
      <Container>
        <Header>
          <h1>💪 Vibe Gains</h1>
        </Header>
        <Dashboard />
        <AddButton onClick={() => setIsAddModalOpen(true)}>
          +
        </AddButton>
        <AddLiftModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
        />
        <AddLiftModal 
          isOpen={isEditModalOpen} 
          onClose={handleCloseEditModal}
          editLift={editLift || undefined}
        />
      </Container>
    </LiftProvider>
  );
};

export default App;