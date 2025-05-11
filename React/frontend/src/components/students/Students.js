import React, { useState, useEffect} from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress, Dialog, 
  DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, Select, MenuItem,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  GetApp as DownloadIcon,  // Alternative to Download
  Search as SearchIcon,
  FilterAlt as FilterIcon 
} from '@mui/icons-material';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [grades, setGrades] = useState([]);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ loading: false, message: '', error: false });

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, selectedGrade]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = {};
      if (searchQuery) params.name = searchQuery;
      if (selectedGrade) params.grade = selectedGrade;
      
      const response = await axios.get('http://localhost:8000/api/students/', { params });
      console.log('API Response:', response.data);
      
      // Ensure each student has a vaccination_status object
      const studentsWithDefaultStatus = response.data.map(student => ({
        ...student,
        vaccination_status: student.vaccination_status || { 
          status: 'Not Vaccinated', 
          count: 0, 
          vaccines: [] 
        }
      }));
      
      setStudents(studentsWithDefaultStatus);
      
      // Extract unique grades for filter dropdown
      const uniqueGrades = [...new Set(studentsWithDefaultStatus.map(student => student.grade))].sort();
      setGrades(uniqueGrades);
      
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setCsvFile(event.target.files[0]);
  };

const handleUpload = async () => {
  if (!csvFile) {
    setUploadStatus({ loading: false, message: 'Please select a CSV file', error: true });
    return;
  }
  
  setUploadStatus({ loading: true, message: 'Uploading...', error: false });
  
  const formData = new FormData();
  formData.append('file', csvFile);
  
  try {
    // Use your API utility instead of direct axios call
    const response = await fetch('http://localhost:8000/api/students/bulk_import/', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    setUploadStatus({ 
      loading: false, 
      message: `Success! ${data.message}`, 
      error: false 
    });
    
    // Refresh student list
    fetchStudents();
    
    // Reset file input
    setCsvFile(null);
    
    // Close dialog after a delay
    setTimeout(() => {
      setOpenUploadDialog(false);
      setUploadStatus({ loading: false, message: '', error: false });
    }, 2000);
    
  } catch (error) {
    console.error('Upload error:', error);
    setUploadStatus({ 
      loading: false,
      message: error.message || 'Upload failed. Please check your CSV file format.', 
      error: true 
    });
  }
};

const renderVaccinationStatus = (status) => {
  // Check if status is undefined or null
  if (!status) {
    return (
      <Chip 
        label="Unknown" 
        color="default" 
        variant="outlined"
        size="small"
      />
    );
  }
  
  // Log for debugging
  console.log("Vaccination status:", status);
  
  if (status.status === 'Vaccinated' && status.count > 0) {
    return (
      <Chip 
        label={`Vaccinated (${status.count || 0})`} 
        color="success" 
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  } else {
    return (
      <Chip 
        label="Not Vaccinated" 
        color="error" 
        variant="outlined"
        size="small"
      />
    );
  }
};

  return (
   
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Students</Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudDownloadIcon />}
            onClick={() => window.location.href = 'http://localhost:8000/api/students/export/'}
        >
            Export All Students
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={() => setOpenUploadDialog(true)}
            sx={{ mr: 1 }}
          >
            Bulk Import
          </Button>
          <Button
            component={Link}
            to="/students/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Student
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search by Name or ID"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
            sx={{ flexGrow: 1, minWidth: '200px' }}
          />
          
          <FormControl size="small" sx={{ minWidth: '150px' }}>
            <InputLabel>Grade</InputLabel>
            <Select
              value={selectedGrade}
              label="Grade"
              onChange={(e) => setSelectedGrade(e.target.value)}
              startAdornment={<FilterIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="">All Grades</MenuItem>
              {grades.map((grade) => (
                <MenuItem key={grade} value={grade}>{grade}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No students found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Try adjusting your search or add new students
          </Typography>
          <Button
            component={Link}
            to="/students/add"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Student
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Student ID</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Grade</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Section</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date of Birth</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vaccination Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{`${student.first_name} ${student.last_name}`}</TableCell>
                  <TableCell>{student.grade}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{new Date(student.date_of_birth).toLocaleDateString()}</TableCell>
                  <TableCell>{renderVaccinationStatus(student.vaccination_status)}</TableCell>
                  <TableCell>
                    <IconButton 
                      component={Link} 
                      to={`/students/edit/${student.id}`}
                      color="primary"
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(25, 118, 210, 0.1)', 
                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.2)' } 
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* CSV Upload Dialog remains the same */}
        <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)}>
        <DialogTitle>Bulk Import Students</DialogTitle>
        <DialogContent>
            <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
                Upload a CSV file with student information.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                CSV should include columns: first_name, last_name, student_id, date_of_birth, grade, section
            </Typography>
            
            {uploadStatus.message && (
                <Alert 
                severity={uploadStatus.error ? "error" : "success"} 
                sx={{ mt: 2, mb: 2 }}
                >
                {uploadStatus.message}
                </Alert>
            )}
            
            <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 2 }}
                disabled={uploadStatus.loading}
            >
                Select CSV File
                <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
                />
            </Button>
            
            {csvFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {csvFile.name}
                </Typography>
            )}
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenUploadDialog(false)} disabled={uploadStatus.loading}>
            Cancel
            </Button>
            <Button 
            onClick={handleUpload} 
            color="primary" 
            disabled={!csvFile || uploadStatus.loading}
            startIcon={uploadStatus.loading ? <CircularProgress size={20} /> : null}
            >
            {uploadStatus.loading ? 'Uploading...' : 'Upload'}
            </Button>
        </DialogActions>
        </Dialog>      
      {/* ... */}
    </Box>
  );
};

export default Students;