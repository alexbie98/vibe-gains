import React, { useState } from 'react';
import { LiftProvider } from './context/LiftContext';
import Dashboard from './components/Dashboard';
import AddLiftModal from './components/AddLiftModal';
import { GlobalStyle, Container, Header, AddButton } from './styles/GlobalStyles';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <LiftProvider>
      <GlobalStyle />
      <Container>
        <Header>
          <h1>💪 Vibe Gains</h1>
        </Header>
        <Dashboard />
        <AddButton onClick={() => setIsModalOpen(true)}>
          +
        </AddButton>
        <AddLiftModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      </Container>
    </LiftProvider>
  );
};

export default App;