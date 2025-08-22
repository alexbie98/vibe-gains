import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BodyWeight } from '../types';
import { apiService } from '../services/api';

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e2e8f0;

  h2 {
    color: #2d3748;
    margin: 0;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #718096;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #2d3748;
  }
`;

const Form = styled.form`
  padding: 25px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #4a5568;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  background: #e2e8f0;
  color: #4a5568;
  transition: all 0.3s ease;

  &:hover {
    background: #cbd5e0;
  }
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

interface AddBodyWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBodyWeightAdded?: () => void;
  editBodyWeight?: BodyWeight;
}

const getTodayLocalDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddBodyWeightModal: React.FC<AddBodyWeightModalProps> = ({ 
  isOpen, 
  onClose, 
  onBodyWeightAdded,
  editBodyWeight 
}) => {
  const [weight, setWeight] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalDateString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!editBodyWeight;

  // Effect to populate form when editing
  useEffect(() => {
    if (editBodyWeight) {
      setWeight(editBodyWeight.weight);
      
      // Convert date string to input format (YYYY-MM-DD)
      const bodyWeightDate = new Date(editBodyWeight.date);
      const formattedDate = bodyWeightDate.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
    } else {
      // Reset form for add mode
      setWeight(0);
      setSelectedDate(getTodayLocalDateString());
    }
  }, [editBodyWeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && editBodyWeight) {
        await apiService.updateBodyWeight(editBodyWeight.id, { weight, date: selectedDate });
      } else {
        await apiService.createBodyWeight({ weight, date: selectedDate });
      }
      
      if (onBodyWeightAdded) {
        onBodyWeightAdded();
      }
      
      handleClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} body weight:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'add'} body weight. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setWeight(0);
    setSelectedDate(getTodayLocalDateString());
    onClose();
  };

  return (
    <Modal isOpen={isOpen}>
      <ModalContent>
        <ModalHeader>
          <h2>{isEditMode ? 'Edit Body Weight' : 'Record Body Weight'}</h2>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Weight (lbs):</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              placeholder="Enter your weight"
              value={weight || ''}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <label>Date:</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </FormGroup>

          <FormActions>
            <CancelButton type="button" onClick={handleClose}>
              Cancel
            </CancelButton>
            <SaveButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Recording...') : (isEditMode ? 'Update' : 'Record')}
            </SaveButton>
          </FormActions>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default AddBodyWeightModal;