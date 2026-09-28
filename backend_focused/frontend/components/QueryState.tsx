import { Alert, Box, CircularProgress, Typography } from '@mui/material';

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <Box display="flex" alignItems="center" gap={1.5} sx={{ py: 6 }} justifyContent="center">
      <CircularProgress size={22} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <Alert severity="error" sx={{ my: 2 }}>
      {message}
    </Alert>
  );
}

export function EmptyBlock({ message }: { message: string }) {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography color="text.secondary">{message}</Typography>
    </Box>
  );
}
