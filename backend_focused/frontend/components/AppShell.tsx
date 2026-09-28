import { Link, useLocation } from 'react-router-dom';
import { AppBar, Box, Container, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Vehicles', href: '/vehicles' },
  { label: 'Offices', href: '/offices' },
  { label: 'Mechanics', href: '/mechanics' },
];

function activeTabValue(pathname: string) {
  const match = NAV_ITEMS.find((item) =>
    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  );
  return match?.href ?? false;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ mr: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LocalShippingOutlinedIcon fontSize="small" /> Fleet Tracker
          </Typography>
          <Tabs value={activeTabValue(pathname)} textColor="primary" indicatorColor="primary">
            {NAV_ITEMS.map((item) => (
              <Tab
                key={item.href}
                value={item.href}
                label={item.label}
                component={Link}
                to={item.href}
                sx={{ minHeight: 64, textTransform: 'none', fontWeight: 500 }}
              />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box component="main" flexGrow={1} sx={{ bgcolor: 'background.default', py: 4 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
}
