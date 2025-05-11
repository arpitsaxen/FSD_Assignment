import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, CircularProgress, TablePagination, Alert
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { saveAs } from 'file-saver';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [grades, setGrades] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  
  const [filters, setFilters] = useState({
    vaccine_id: '',
    grade: '',
    start_date: '',
    end_date: ''
  });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch vaccines
        const vaccinesResponse = await axios.get('http://localhost:8000/api/vaccines/');
        setVaccines(vaccinesResponse.data);
        
        // Fetch students to extract unique grades
        const studentsResponse = await axios.get('http://localhost:8000/api/students/');
        const uniqueGrades = [...new Set(studentsResponse.data.map(student => student.grade))].sort();
        setGrades(uniqueGrades);
        
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    
    fetchInitialData();
  }, []);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handleSearch = async () => {
    setLoading(true);
    
    try {
      const response = await axios.get('http://localhost:8000/api/reports/vaccination_report/', {
        params: filters
      });
      
      setVaccinations(response.data);
      setPage(0); // Reset to first page
    } catch (error) {
      console.error('Error fetching vaccination report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleExport = async (format) => {
    try {
      const response = await axios.get('http://localhost:8000/api/reports/vaccination_report/', {
        params: {
          ...filters,
          format: format
        },
        responseType: 'blob'
      });
      
      // Use file-saver to download the file
      saveAs(new Blob([response.data]), `vaccination_report.${format}`);
      
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Vaccination Reports
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filter Options
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Vaccine</InputLabel>
              <Select
                name="vaccine_id"
                value={filters.vaccine_id}
                onChange={handleFilterChange}
                label="Vaccine"
              >
                <MenuItem value="">All Vaccines</MenuItem>
                {vaccines.map((vaccine) => (
                  <MenuItem key={vaccine.id} value={vaccine.id}>
                    {vaccine.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Grade</InputLabel>
              <Select
                name="grade"
                value={filters.grade}
                onChange={handleFilterChange}
                label="Grade"
              >
                <MenuItem value="">All Grades</MenuItem>
                {grades.map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    Grade {grade}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              name="start_date"
              label="Start Date"
              type="date"
              value={filters.start_date}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              name="end_date"
              label="End Date"
              type="date"
              value={filters.end_date}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FilterAltIcon />}
            onClick={handleSearch}
          >
            Apply Filters
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => handleExport('csv')}
            disabled={vaccinations.length === 0}
          >
            Export as CSV
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Vaccination Records
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : vaccinations.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>
            No vaccination records found. Try applying different filters or click "Apply Filters" to see all records.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Section</TableCell>
                    <TableCell>Vaccine</TableCell>
                    <TableCell>Date Administered</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccinations
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.student_id}</TableCell>
                        <TableCell>{record.student_name}</TableCell>
                        <TableCell>{record.grade}</TableCell>
                        <TableCell>{record.section}</TableCell>
                        <TableCell>{record.vaccine_name}</TableCell>
                        <TableCell>{new Date(record.date_administered).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={vaccinations.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;