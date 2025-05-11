import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Grid, Paper, Typography, Box, Button, Card, CardContent, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import EventIcon from '@mui/icons-material/Event';
import PercentIcon from '@mui/icons-material/Percent';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    vaccinated_students: 0,
    vaccination_percentage: 0,
    upcoming_drives: 0
  });
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dashboard statistics
        const statsResponse = await axios.get('http://localhost:8000/api/reports/dashboard_stats/');
        setStats(statsResponse.data);
        
        // Get student stats
        const studentsResponse = await axios.get('http://localhost:8000/api/students/');
        const students = studentsResponse.data;

        // Fetch upcoming drives
        const drivesResponse = await axios.get('http://localhost:8000/api/drives/?next_month=true');
        setUpcomingDrives(drivesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Quick Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PeopleIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6">Total Students</Typography>
            <Typography variant="h4">{stats.total_students}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <VaccinesIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6">Vaccinated</Typography>
            <Typography variant="h4">{stats.vaccinated_students}</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PercentIcon color="secondary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6">Percentage</Typography>
            <Typography variant="h4">{stats.vaccination_percentage}%</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <EventIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h6">Upcoming Drives</Typography>
            <Typography variant="h4">{stats.upcoming_drives}</Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Links */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button 
            component={Link} 
            to="/students/add" 
            variant="contained" 
            color="primary" 
            fullWidth
            size="large"
          >
            Add Student
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button 
            component={Link} 
            to="/drives/add" 
            variant="contained" 
            color="secondary" 
            fullWidth
            size="large"
          >
            Create Vaccination Drive
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Button 
            component={Link} 
            to="/drives" 
            variant="contained" 
            color="secondary" 
            fullWidth
            size="large"
          >
            Manage Vaccination Drives
          </Button>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Button 
            component={Link} 
            to="/students" 
            variant="contained" 
            color="info" 
            fullWidth
            size="large"
          >
            Manage Students
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button 
            component={Link} 
            to="/reports" 
            variant="contained" 
            color="success" 
            fullWidth
            size="large"
          >
            Generate Reports
          </Button>
        </Grid>
      </Grid>
      
      {/* Upcoming Vaccination Drives */}
      <Typography variant="h5" gutterBottom>
        Upcoming Vaccination Drives
      </Typography>
      
      {upcomingDrives.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">No upcoming drives scheduled</Typography>
          <Button 
            component={Link} 
            to="/drives/add" 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
          >
            Schedule a Drive
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {upcomingDrives.map((drive) => (
            <Grid item xs={12} sm={6} md={4} key={drive.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{drive.vaccine_name}</Typography>
                  <Typography variant="body1">Date: {new Date(drive.date).toLocaleDateString()}</Typography>
                  <Typography variant="body1">Grades: {drive.applicable_grades}</Typography>
                  <Typography variant="body1">
                    Doses: {drive.doses_used} / {drive.doses_available}
                  </Typography>
                  <Button 
                    component={Link} 
                    to={`/drives/edit/${drive.id}`}
                    variant="outlined" 
                    color="primary"
                    sx={{ mt: 2 }}
                    fullWidth
                  >
                    Manage Drive
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;