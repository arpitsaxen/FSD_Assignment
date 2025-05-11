import React, { useContext, useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Box, CssBaseline, Divider, Avatar,
  ThemeProvider, createTheme, useMediaQuery, Collapse, ListItemButton,
  Menu, MenuItem, Badge, Tooltip, Button, styled
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  MedicalServices as VaccinesIcon,
  Assessment as AssessmentIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ExpandLess, ExpandMore,
  School as SchoolIcon,
  MedicalInformation as MedicalIcon,
  MedicalInformation as MedicalInformationIcon,
  Help as HelpIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00acc1', // Teal
      light: '#26c6da',
      dark: '#00838f',
      contrastText: '#fff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'linear-gradient(to bottom, #1976d2, #1565c0)',
          color: '#fff',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.9)',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#fff',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
  },
});

// Styled components
const DrawerHeader = styled('div')({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
});

const LogoContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  color: '#fff',
});

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const drawerWidth = 260;
  
  // Close drawer when navigating on small screens
  useEffect(() => {
    if (isSmallScreen) {
      setMobileOpen(false);
    }
  }, [location.pathname, isSmallScreen]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleSubMenuToggle = () => {
    setOpenSubMenu(!openSubMenu);
  };
  
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  // Navigation handler function
  const handleNavigation = (path) => {
    console.log("Navigating to:", path); // For debugging
    navigate(path);
    if (isSmallScreen) {
      setMobileOpen(false);
    }
  };
  
  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      active: isActive('/dashboard'),
    },
    { 
      text: 'Students', 
      icon: <PeopleIcon />, 
      path: '/students',
      active: isActive('/students') || location.pathname.startsWith('/students/'),
    },
    { 
        text: 'Vaccines', 
        icon: <MedicalInformationIcon />, // Use an appropriate icon 
        path: '/vaccines',
        active: isActive('/vaccines'),
    },
    { 
      text: 'Vaccination Drives', 
      icon: <VaccinesIcon />, 
      path: '/drives',
      active: isActive('/drives') || location.pathname.startsWith('/drives/'),
    },
    { 
      text: 'Reports', 
      icon: <AssessmentIcon />, 
      path: '/reports',
      active: isActive('/reports'),
    },
  ];
  
  const drawer = (
    <div>
      <DrawerHeader>
        <LogoContainer>
          <MedicalIcon fontSize="large" sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap>
            Vaccination Portal
          </Typography>
        </LogoContainer>
        {isSmallScreen && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </DrawerHeader>
      <Divider />
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text}
            disablePadding 
            sx={{
              mb: 0.5,
            }}
          >
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: item.active ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ style: { color: 'white' } }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <List sx={{ px: 1 }}>
        <ListItemButton onClick={handleSubMenuToggle}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <SchoolIcon />
          </ListItemIcon>
          <ListItemText primary="Resources" />
          {openSubMenu ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={openSubMenu} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton sx={{ pl: 4, borderRadius: '8px' }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText primary="Training" />
            </ListItemButton>
            <ListItemButton sx={{ pl: 4, borderRadius: '8px' }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MedicalIcon />
              </ListItemIcon>
              <ListItemText primary="Vaccine Info" />
            </ListItemButton>
          </List>
        </Collapse>
        
        <ListItem disablePadding sx={{ mt: 1 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
      
      {/* User profile at the bottom */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 0, 
        width: '100%', 
        p: 2,
        bgcolor: 'rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
      }}>
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
        >
          <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
            {user?.username?.charAt(0).toUpperCase() || 'C'}
          </Avatar>
        </StyledBadge>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
            {user?.username || 'Coordinator'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            School Coordinator
          </Typography>
        </Box>
      </Box>
    </div>
  );
  
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            bgcolor: '#fff',
            color: theme.palette.text.primary,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <MedicalIcon color="primary" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              School Vaccination Portal
            </Typography>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={handleNotificationsOpen}
                size="large"
              >
                <Badge badgeContent={3} color="secondary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                sx: { width: 320, maxHeight: 400 },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" sx={{ fontSize: 16 }}>Notifications</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleNotificationsClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Upcoming Vaccination Drive
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    MMR vaccination drive scheduled tomorrow
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    New Students Added
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    15 new students were added via CSV import
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Low Vaccine Supply
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Influenza vaccine supply running low
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button size="small" onClick={handleNotificationsClose}>
                  Mark all as read
                </Button>
              </Box>
            </Menu>
            
            {/* User menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.primary.main }}>
                    {user?.username?.charAt(0).toUpperCase() || 'C'}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              PaperProps={{
                sx: { minWidth: 200 },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  {user?.username || 'Coordinator'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  School Coordinator
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            bgcolor: 'background.default',
            minHeight: '100vh',
          }}
        >
          <Toolbar />
          {/* Page content */}
          <Box 
            sx={{ 
              bgcolor: 'background.default',
              borderRadius: 2,
              py: 1
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout;