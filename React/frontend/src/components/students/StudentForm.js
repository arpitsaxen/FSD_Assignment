import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { studentAPI } from '../../api/axios';
import {
  Box, Typography, TextField, Button, Grid, Paper, CircularProgress,
  Alert, Divider, Chip, Card, CardContent
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const StudentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vaccinations, setVaccinations] = useState([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    student_id: '',
    date_of_birth: '',
    grade: '',
    section: ''
  });
  
  useEffect(() => {
    const fetchStudentData = async () => {
      if (isEditMode) {
        try {
          const response = await studentAPI.getById(id);
          
          setFormData({
            first_name: response.data.first_name,
            last_name: response.data.last_name,
            student_id: response.data.student_id,
            date_of_birth: response.data.date_of_birth,
            grade: response.data.grade,
            section: response.data.section
          });
          
          // Set vaccinations data if available
          if (response.data.vaccination_status && response.data.vaccination_status.vaccines) {
            setVaccinations(response.data.vaccination_status.vaccines);
          }
          
        } catch (error) {
          console.error('Error fetching student:', error);
          setError('Failed to load student data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchStudentData();
  }, [id, isEditMode]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    // Simple validation
    if (!formData.first_name.trim()) return 'First name is required';
    if (!formData.last_name.trim()) return 'Last name is required';
    if (!formData.student_id.trim()) return 'Student ID is required';
    if (!formData.date_of_birth) return 'Date of birth is required';
    if (!formData.grade.trim()) return 'Grade is required';
    if (!formData.section.trim()) return 'Section is required';
    return null;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setSaving(true);
    
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:8000/api/students/${id}/`, formData);
        setSuccess('Student updated successfully');
      } else {
        await axios.post('http://localhost:8000/api/students/', formData);
        setSuccess('Student added successfully');
        
        // Reset form after successful creation if not in edit mode
        if (!isEditMode) {
          setFormData({
            first_name: '',
            last_name: '',
            student_id: '',
            date_of_birth: '',
            grade: '',
            section: ''
          });
        }
      }
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/students');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving student:', error);
      
      if (error.response && error.response.data) {
        // Format error message from API response
        if (typeof error.response.data === 'object') {
          const errorMessages = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(error.response.data);
        }
      } else {
        setError('Failed to save student. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/students')}
          sx={{ mr: 2 }}
        >
          Back to Students
        </Button>
        <Typography variant="h4">
          {isEditMode ? 'Edit Student' : 'Add New Student'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="first_name"
                label="First Name"
                value={formData.first_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="last_name"
                label="Last Name"
                value={formData.last_name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="student_id"
                label="Student ID"
                value={formData.student_id}
                onChange={handleInputChange}
                fullWidth
                required
                disabled={isEditMode} // Don't allow editing ID for existing students
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="grade"
                label="Grade"
                value={formData.grade}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="section"
                label="Section"
                value={formData.section}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{ mt: 2 }}
              >
                {saving ? 'Saving...' : (isEditMode ? 'Update Student' : 'Add Student')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Vaccination History (only in Edit mode) */}
      {isEditMode && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Vaccination History
          </Typography>
          
          <Paper sx={{ p: 3, boxShadow: 2 }}>
            {vaccinations.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No vaccination records found for this student.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {vaccinations.map((vac) => (
                  <Grid item xs={12} sm={6} md={4} key={vac.id}>
                    <Card sx={{ height: '100%', boxShadow: 1 }}>
                      <CardContent>
                        <Typography variant="h6" color="primary">{vac.vaccine_name}</Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Administered on: {new Date(vac.date).toLocaleDateString()}
                        </Typography>
                        <Chip 
                          label="Vaccinated" 
                          color="success" 
                          size="small"
                          sx={{ mt: 2 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default StudentForm;