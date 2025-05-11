import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress, Alert, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const Vaccines = () => {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [dialogError, setDialogError] = useState('');
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // Fetch vaccines on component mount
  useEffect(() => {
    fetchVaccines();
  }, []);
  
  const fetchVaccines = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('http://localhost:8000/api/vaccines/');
      setVaccines(response.data);
    } catch (err) {
      console.error('Error fetching vaccines:', err);
      setError('Failed to load vaccines. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (mode, vaccine = null) => {
    setDialogMode(mode);
    setDialogError('');
    
    if (mode === 'edit' && vaccine) {
      setSelectedVaccine(vaccine);
      setFormData({
        name: vaccine.name,
        description: vaccine.description || ''
      });
    } else {
      setSelectedVaccine(null);
      setFormData({
        name: '',
        description: ''
      });
    }
    
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDialogError('');
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateForm = () => {
    if (!formData.name.trim()) {
      setDialogError('Vaccine name is required');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setDialogError('');
      
      if (dialogMode === 'add') {
        // Add new vaccine
        await axios.post('http://localhost:8000/api/vaccines/', formData);
        setSuccess('Vaccine added successfully');
      } else {
        // Update existing vaccine
        await axios.put(`http://localhost:8000/api/vaccines/${selectedVaccine.id}/`, formData);
        setSuccess('Vaccine updated successfully');
      }
      
      // Refresh the vaccines list
      fetchVaccines();
      
      // Close the dialog
      handleCloseDialog();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error saving vaccine:', err);
      
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${errors}`)
            .join('; ');
          setDialogError(errorMessages);
        } else {
          setDialogError(err.response.data);
        }
      } else {
        setDialogError('Failed to save vaccine. Please try again.');
      }
    }
  };
  
  const handleDelete = async (vaccineId) => {
    if (!window.confirm('Are you sure you want to delete this vaccine?')) {
      return;
    }
    
    try {
      setError('');
      await axios.delete(`http://localhost:8000/api/vaccines/${vaccineId}/`);
      setSuccess('Vaccine deleted successfully');
      
      // Refresh the vaccines list
      fetchVaccines();
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error deleting vaccine:', err);
      setError('Failed to delete vaccine. It may be in use by existing vaccination drives.');
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vaccines</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('add')}
        >
          Add Vaccine
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {vaccines.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No vaccines found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Add your first vaccine to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('add')}
          >
            Add Vaccine
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vaccines.map((vaccine) => (
                <TableRow key={vaccine.id}>
                  <TableCell>{vaccine.name}</TableCell>
                  <TableCell>{vaccine.description || '-'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenDialog('edit', vaccine)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(vaccine.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add/Edit Vaccine Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Vaccine' : 'Edit Vaccine'}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {dialogError}
            </Alert>
          )}
          
          <TextField
            name="name"
            label="Vaccine Name"
            value={formData.name}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
          />
          
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            {dialogMode === 'add' ? 'Add Vaccine' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vaccines;