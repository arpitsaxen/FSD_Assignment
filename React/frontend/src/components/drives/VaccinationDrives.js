// src/components/drives/VaccinationDrives.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { driveAPI } from '../../api/axios';
import {
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Chip, CircularProgress, Tabs, Tab,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const VaccinationDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0); // 0 = upcoming, 1 = past
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDrives();
  }, [tab, searchQuery]);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        upcoming: tab === 0 ? 'true' : 'false'
      };
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await driveAPI.getAll(params);
      setDrives(response.data);
    } catch (error) {
      console.error('Error fetching vaccination drives:', error);
      setError('Failed to load vaccination drives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vaccination Drives</Typography>
        <Button
          component={Link}
          to="/drives/add"
          variant="contained"
          startIcon={<AddIcon />}
        >
          Create Drive
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Search and Tabs */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Search Drives"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          
          <Tabs
            value={tab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Upcoming Drives" />
            <Tab label="Past Drives" />
          </Tabs>
        </Box>
      </Paper>
      
      {/* Drives List */}
      {drives.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No vaccination drives found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {tab === 0 
              ? "No upcoming vaccination drives are scheduled" 
              : "No past vaccination drives found"}
          </Typography>
          {tab === 0 && (
            <Button
              component={Link}
              to="/drives/add"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Create New Drive
            </Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vaccine</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Applicable Grades</TableCell>
                <TableCell>Doses</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drives.map((drive) => {
                const isPast = new Date(drive.date) < new Date();
                const isToday = new Date(drive.date).toDateString() === new Date().toDateString();
                
                return (
                  <TableRow key={drive.id}>
                    <TableCell>{drive.vaccine_name}</TableCell>
                    <TableCell>{new Date(drive.date).toLocaleDateString()}</TableCell>
                    <TableCell>{drive.applicable_grades}</TableCell>
                    <TableCell>
                      {drive.doses_used} / {drive.doses_available}
                    </TableCell>
                    <TableCell>
                      {isPast ? (
                        <Chip label="Completed" color="success" size="small" />
                      ) : isToday ? (
                        <Chip label="Today" color="warning" size="small" />
                      ) : (
                        <Chip label="Upcoming" color="primary" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        component={Link}
                        to={`/drives/edit/${drive.id}`}
                        color="primary"
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default VaccinationDrives;