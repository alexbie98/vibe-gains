import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Select from 'react-select';
import { useLiftContext } from '../context/LiftContext';
import { Set, Lift } from '../types';
import { COMMON_EXERCISES, Exercise } from '../constants/exercises';

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
  max-width: 500px;
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

const DateInput = styled.input`
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

const SetsSection = styled.div`
  h3 {
    margin-bottom: 15px;
    color: #4a5568;
  }
`;

const SetInput = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  align-items: center;

  input {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: #667eea;
    }
  }
`;

const RemoveButton = styled.button`
  background: #fc8181;
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    background: #f56565;
  }
`;

const AddSetButton = styled.button`
  background: #48bb78;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 10px;

  &:hover {
    background: #38a169;
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
`;

interface AddLiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLift?: Lift; // Optional lift to edit
}


const getTodayLocalDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddLiftModal: React.FC<AddLiftModalProps> = ({ isOpen, onClose, editLift }) => {
  const { addLift, updateLift } = useLiftContext();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState<Set[]>([{ weight: 0, reps: 0 }]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayLocalDateString);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if we're in edit mode
  const isEditMode = !!editLift;

  // Effect to populate form when editing
  useEffect(() => {
    if (editLift) {
      // Find matching exercise in COMMON_EXERCISES or create custom option
      const exerciseOption = COMMON_EXERCISES.find(ex => ex.value === editLift.exercise) || 
                           { value: editLift.exercise, label: editLift.exercise };
      setSelectedExercise(exerciseOption);
      setSets(editLift.sets);
      
      // Convert date string to input format (YYYY-MM-DD)
      const liftDate = new Date(editLift.date);
      const formattedDate = liftDate.toISOString().split('T')[0];
      setSelectedDate(formattedDate);
    } else {
      // Reset form for add mode
      setSelectedExercise(null);
      setSets([{ weight: 0, reps: 0 }]);
      setSelectedDate(getTodayLocalDateString());
    }
  }, [editLift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExercise) {
      alert('Please select an exercise');
      return;
    }

    const validSets = sets.filter(set => set.weight > 0 && set.reps > 0);
    
    if (validSets.length === 0) {
      alert('Please add at least one set with weight and reps');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditMode && editLift) {
        await updateLift(editLift.id, selectedExercise.value, validSets, selectedDate);
      } else {
        await addLift(selectedExercise.value, validSets, selectedDate);
      }
      handleClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'add'} lift:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'add'} lift. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedExercise(null);
    setSets([{ weight: 0, reps: 0 }]);
    setSelectedDate(getTodayLocalDateString());
    onClose();
  };

  const addSet = () => {
    setSets([...sets, { weight: 0, reps: 0 }]);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: number) => {
    const newSets = [...sets];
    newSets[index][field] = value;
    setSets(newSets);
  };

  return (
    <Modal isOpen={isOpen}>
      <ModalContent>
        <ModalHeader>
          <h2>{isEditMode ? 'Edit Lift' : 'Add Lift'}</h2>
          <CloseButton onClick={handleClose}>&times;</CloseButton>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Exercise:</label>
            <Select
              value={selectedExercise}
              onChange={setSelectedExercise}
              options={COMMON_EXERCISES}
              isSearchable
              placeholder="Search or select exercise..."
              styles={{
                control: (base) => ({
                  ...base,
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: '#667eea'
                  }
                })
              }}
            />
          </FormGroup>

          <FormGroup>
            <label>Date:</label>
            <DateInput
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </FormGroup>

          <SetsSection>
            <h3>Sets</h3>
            {sets.map((set, index) => (
              <SetInput key={index}>
                <input
                  type="number"
                  placeholder="Weight (lbs)"
                  min="0"
                  step="0.5"
                  value={set.weight || ''}
                  onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                />
                <input
                  type="number"
                  placeholder="Reps"
                  min="1"
                  value={set.reps || ''}
                  onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                />
                {sets.length > 1 && (
                  <RemoveButton type="button" onClick={() => removeSet(index)}>
                    ×
                  </RemoveButton>
                )}
              </SetInput>
            ))}
            <AddSetButton type="button" onClick={addSet}>
              + Add Set
            </AddSetButton>
          </SetsSection>

          <FormActions>
            <CancelButton type="button" onClick={handleClose}>
              Cancel
            </CancelButton>
            <SaveButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Lift' : 'Save Lift')}
            </SaveButton>
          </FormActions>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default AddLiftModal;