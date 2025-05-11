import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, TextField, Button, Grid, Paper, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Alert, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Autocomplete, Chip, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

const DriveForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const [vaccines, setVaccines] = useState([]);
  const [vaccinatedStudents, setVaccinatedStudents] = useState([]);
  const [openStudentDialog, setOpenStudentDialog] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [vaccinationErrors, setVaccinationErrors] = useState([]);
  
  const [formData, setFormData] = useState({
    vaccine: '',
    date: '',
    doses_available: '',
    applicable_grades: ''
  });
  
  // Calculate minimum date (15 days from today)
  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 15);
    return minDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  
  // Fetch drive data and vaccines
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vaccines
        const vaccinesResponse = await axios.get('http://localhost:8000/api/vaccines/');
        setVaccines(vaccinesResponse.data);
        
        if (isEditMode) {
          // Fetch drive data
          const driveResponse = await axios.get(`http://localhost:8000/api/drives/${id}/`);
          setFormData({
            vaccine: driveResponse.data.vaccine,
            date: driveResponse.data.date,
            doses_available: driveResponse.data.doses_available,
            applicable_grades: driveResponse.data.applicable_grades
          });
          
          // Fetch vaccinated students for this drive
          await refreshVaccinatedStudents();
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);
  
  // Refresh the list of vaccinated students
  const refreshVaccinatedStudents = async () => {
    try {
      const vaccinationsResponse = await axios.get('http://localhost:8000/api/vaccinations/', {
        params: { drive_id: id }
      });
      console.log("Vaccinated students:", vaccinationsResponse.data);
      setVaccinatedStudents(vaccinationsResponse.data);
      return vaccinationsResponse.data;
    } catch (error) {
      console.error('Error fetching vaccinated students:', error);
      return [];
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user changes it
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.vaccine) errors.vaccine = 'Vaccine is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.doses_available) errors.doses_available = 'Number of doses is required';
    if (!formData.applicable_grades) errors.applicable_grades = 'Applicable grades is required';
    
    // Validate date is at least 15 days in the future
    const minDate = getMinDate();
    if (formData.date && formData.date < minDate) {
      errors.date = `Date must be at least 15 days in the future (after ${minDate})`;
    }
    
    // Check if doses is a positive number
    if (formData.doses_available && parseInt(formData.doses_available, 10) <= 0) {
      errors.doses_available = 'Number of doses must be positive';
    }
    
    // Check if applicable grades has valid format
    if (formData.applicable_grades && !/^[0-9]+(-[0-9]+)?$/.test(formData.applicable_grades)) {
      errors.applicable_grades = 'Format should be like "5" or "5-7"';
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    setSuccess('');
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSaving(true);
    
    try {
      if (isEditMode) {
        await axios.put(`http://localhost:8000/api/drives/${id}/`, formData);
        setSuccess('Vaccination drive updated successfully');
      } else {
        const response = await axios.post('http://localhost:8000/api/drives/', formData);
        setSuccess('Vaccination drive created successfully');
        // Navigate to edit page for the newly created drive
        setTimeout(() => {
          navigate(`/drives/edit/${response.data.id}`);
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving drive:', error);
      
      if (error.response && error.response.data) {
        // Handle field-specific errors
        if (typeof error.response.data === 'object') {
          if (error.response.data.date) {
            // Handle date validation error
            setFormErrors({
              ...formErrors,
              date: Array.isArray(error.response.data.date) 
                ? error.response.data.date[0] 
                : error.response.data.date
            });
          } else {
            // Handle other field errors
            setFormErrors(error.response.data);
          }
        } else {
          // Generic error
          setError(error.response.data.toString() || 'Failed to save vaccination drive');
        }
      } else {
        setError('Failed to save vaccination drive. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Custom function to check if student is already vaccinated with this vaccine
  const getAlreadyVaccinatedStudents = async () => {
    try {
      // Get the current vaccine ID from the drive
      const vaccineId = formData.vaccine;
      if (!vaccineId) return [];
      
      // Get all vaccinations for all students
      const allVaccinationsResponse = await axios.get('http://localhost:8000/api/vaccinations/');
      const allVaccinations = allVaccinationsResponse.data;
      
      // Filter vaccinations for the current vaccine
      const vaccinationsWithSameVaccine = allVaccinations.filter(v => {
        // Need to check if vaccination_drive contains the same vaccine
        return v.vaccination_drive && v.vaccination_drive.vaccine === parseInt(vaccineId);
      });
      
      // Extract student IDs
      return vaccinationsWithSameVaccine.map(v => v.student);
    } catch (error) {
      console.error('Error checking vaccinated students:', error);
      return [];
    }
  };
  
  const handleOpenStudentDialog = async () => {
    try {
      setError('');
      setVaccinationErrors([]);
      setLoadingStudents(true);
      
      // Ensure we have grade values to use
      if (!formData.applicable_grades) {
        setError('Please specify applicable grades before adding students');
        setLoadingStudents(false);
        return;
      }
      
      // Parse the grade range
      let minGrade, maxGrade;
      if (formData.applicable_grades.includes('-')) {
        const grades = formData.applicable_grades.split('-');
        minGrade = parseInt(grades[0], 10);
        maxGrade = parseInt(grades[1], 10);
      } else {
        minGrade = maxGrade = parseInt(formData.applicable_grades, 10);
      }
      
      console.log(`Fetching students for grades ${minGrade} to ${maxGrade}`);
      
      // Fetch all students
      const studentsResponse = await axios.get('http://localhost:8000/api/students/');
      console.log("All students:", studentsResponse.data);
      
      // Get students already vaccinated with this vaccine
      const alreadyVaccinatedIds = await getAlreadyVaccinatedStudents();
      console.log("Already vaccinated with this vaccine:", alreadyVaccinatedIds);
      
      // Fetch current vaccinated students in this drive to exclude them
      const currentVaccinated = await refreshVaccinatedStudents();
      const currentVaccinatedIds = currentVaccinated.map(v => v.student);
      
      // Filter eligible students
      const eligibleStudents = studentsResponse.data.filter(student => {
        const studentGrade = parseInt(student.grade, 10);
        // Check grade in range
        const gradeInRange = studentGrade >= minGrade && studentGrade <= maxGrade;
        // Check not already vaccinated in this drive
        const notInCurrentDrive = !currentVaccinatedIds.includes(student.id);
        // Check not already vaccinated with this vaccine in any drive
        const notAlreadyVaccinated = !alreadyVaccinatedIds.includes(student.id);
        
        return gradeInRange && notInCurrentDrive && notAlreadyVaccinated;
      });
      
      console.log("Eligible students:", eligibleStudents);
      setAvailableStudents(eligibleStudents);
      setOpenStudentDialog(true);
      
    } catch (error) {
      console.error('Error fetching available students:', error);
      setError('Failed to load available students: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingStudents(false);
    }
  };
  
  const handleVaccinateStudents = async () => {
    if (selectedStudents.length === 0) {
      setError('Please select at least one student');
      return;
    }
    
    setError('');
    setSuccess('');
    setVaccinationErrors([]);
    setSaving(true);
    
    try {
      console.log("Attempting to vaccinate students:", selectedStudents.map(s => s.id));
      
      // Check if we have enough doses left
      const currentVaccinations = await refreshVaccinatedStudents();
      const currentCount = currentVaccinations.length;
      const remainingDoses = formData.doses_available - currentCount;
      
      if (selectedStudents.length > remainingDoses) {
        setError(`Cannot add ${selectedStudents.length} students. Only ${remainingDoses} doses available.`);
        setSaving(false);
        return;
      }
      
      // Track successful and failed vaccinations
      const successfulVaccinations = [];
      const failedVaccinations = [];
      
      // Process each student one by one to handle individual errors
      for (const student of selectedStudents) {
        try {
          await axios.post('http://localhost:8000/api/vaccinations/', {
            student: student.id,
            vaccination_drive: id,
            date_administered: new Date().toISOString().split('T')[0]
          });
          
          successfulVaccinations.push(student);
        } catch (error) {
          console.error(`Error vaccinating student ${student.id}:`, error);
          
          // Extract error message
          let errorMessage = 'Unknown error';
          if (error.response && error.response.data) {
            if (Array.isArray(error.response.data)) {
              errorMessage = error.response.data[0];
            } else if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else {
              errorMessage = JSON.stringify(error.response.data);
            }
          }
          
          failedVaccinations.push({
            student: student,
            error: errorMessage
          });
        }
      }
      
      // Refresh vaccinated students list
      await refreshVaccinatedStudents();
      
      // Set success or error messages
      if (successfulVaccinations.length > 0) {
        setSuccess(`Successfully vaccinated ${successfulVaccinations.length} students`);
      }
      
      if (failedVaccinations.length > 0) {
        setVaccinationErrors(failedVaccinations);
        if (successfulVaccinations.length === 0) {
          setError(`Failed to vaccinate any students. See details below.`);
        }
      }
      
      // Close dialog if all operations were successful
      if (failedVaccinations.length === 0) {
        setOpenStudentDialog(false);
      }
      
      // Remove successfully vaccinated students from selection
      setSelectedStudents(selectedStudents.filter(student => 
        !successfulVaccinations.some(s => s.id === student.id)
      ));
      
    } catch (error) {
      console.error('Error during vaccination process:', error);
      setError('An unexpected error occurred: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };
  
  const handleStudentSearchChange = (e, value) => {
    setStudentSearch(e.target.value);
  };
  
  const filterStudentsBySearch = () => {
    if (!studentSearch || studentSearch.length < 2) return availableStudents;
    
    return availableStudents.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const id = student.student_id.toLowerCase();
      const search = studentSearch.toLowerCase();
      
      return fullName.includes(search) || id.includes(search);
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  const isPastDrive = isEditMode && new Date(formData.date) < new Date();
  const filteredStudents = filterStudentsBySearch();
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/drives')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4">
          {isEditMode ? 'Edit Vaccination Drive' : 'Create Vaccination Drive'}
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
      )}
      
      {isPastDrive && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This drive is in the past and cannot be edited.
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.vaccine}>
                <InputLabel>Vaccine</InputLabel>
                <Select
                  name="vaccine"
                  value={formData.vaccine}
                  onChange={handleInputChange}
                  label="Vaccine"
                  disabled={isPastDrive || isEditMode} // Don't allow changing vaccine for existing drives
                >
                  <MenuItem value="" disabled>Select a vaccine</MenuItem>
                  {vaccines.map((vaccine) => (
                    <MenuItem key={vaccine.id} value={vaccine.id}>
                      {vaccine.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.vaccine && (
                  <Typography variant="caption" color="error">
                    {formErrors.vaccine}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="date"
                label="Drive Date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                disabled={isPastDrive}
                error={!!formErrors.date}
                helperText={formErrors.date || `Must be after ${getMinDate()} (15 days from today)`}
                inputProps={{ min: getMinDate() }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="doses_available"
                label="Available Doses"
                type="number"
                value={formData.doses_available}
                onChange={handleInputChange}
                fullWidth
                required
                disabled={isPastDrive}
                error={!!formErrors.doses_available}
                helperText={formErrors.doses_available}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="applicable_grades"
                label="Applicable Grades"
                value={formData.applicable_grades}
                onChange={handleInputChange}
                fullWidth
                required
                disabled={isPastDrive}
                error={!!formErrors.applicable_grades}
                helperText={formErrors.applicable_grades || "E.g., '5-7' for grades 5 to 7, or '5' for just grade 5"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={saving || isPastDrive}
                sx={{ mt: 2 }}
              >
                {saving ? 'Saving...' : (isEditMode ? 'Update Drive' : 'Create Drive')}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {/* Vaccinated Students List (only in Edit mode) */}
      {isEditMode && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">
              Vaccinated Students
            </Typography>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<PersonAddIcon />}
              onClick={handleOpenStudentDialog}
              disabled={isPastDrive || loadingStudents}
            >
              {loadingStudents ? 'Loading...' : 'Add Students'}
            </Button>
          </Box>
          
          <Paper sx={{ p: 3 }}>
            {vaccinatedStudents.length === 0 ? (
              <Typography>No students have been vaccinated in this drive yet.</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Date Administered</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vaccinatedStudents.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.student_id}</TableCell>
                        <TableCell>{record.student_name}</TableCell>
                        <TableCell>{new Date(record.date_administered).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Typography variant="body2">
                    {vaccinatedStudents.length} of {formData.doses_available} doses used
                  </Typography>
                </Box>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}
      
      {/* Dialog for adding students to the vaccination drive */}
      <Dialog 
        open={openStudentDialog} 
        onClose={() => !saving && setOpenStudentDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Students to Vaccination Drive</DialogTitle>
        <DialogContent>
          {vaccinationErrors.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some students could not be vaccinated:
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '24px' }}>
                {vaccinationErrors.map((error, index) => (
                  <li key={index}>
                    {error.student.first_name} {error.student.last_name}: {error.error}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          
          <Box sx={{ mb: 3, mt: 1 }}>
            <TextField
              label="Search Students"
              variant="outlined"
              fullWidth
              value={studentSearch}
              onChange={handleStudentSearchChange}
              placeholder="Type to search by name or ID..."
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Showing students in applicable grades who haven't received this vaccine yet.
          </Typography>
          
          {availableStudents.length === 0 && (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
              No eligible students found. All students in the applicable grades may already be vaccinated with this vaccine.
            </Typography>
          )}
          
          {availableStudents.length > 0 && (
            <Box>
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedStudents.map((student) => (
                  <Chip
                    key={student.id}
                    label={`${student.first_name} ${student.last_name}`}
                    onDelete={() => setSelectedStudents(selectedStudents.filter(s => s.id !== student.id))}
                    color="primary"
                    size="small"
                  />
                ))}
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Grade</TableCell>
                      <TableCell>Section</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No students match your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.slice(0, 10).map((student) => {
                        const isSelected = selectedStudents.some(s => s.id === student.id);
                        
                        return (
                          <TableRow 
                            key={student.id}
                            selected={isSelected}
                            hover
                            onClick={() => {
                              if (isSelected) {
                                setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
                              } else {
                                setSelectedStudents([...selectedStudents, student]);
                              }
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{student.student_id}</TableCell>
                            <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                            <TableCell>{student.grade}</TableCell>
                            <TableCell>{student.section}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {filteredStudents.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          {filteredStudents.length - 10} more students available. Refine your search to see more.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStudentDialog(false)} disabled={saving}>Cancel</Button>
          <Button 
            onClick={handleVaccinateStudents} 
            variant="contained" 
            color="primary"
            disabled={selectedStudents.length === 0 || saving}
          >
            {saving ? 'Processing...' : `Add Selected Students (${selectedStudents.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriveForm;