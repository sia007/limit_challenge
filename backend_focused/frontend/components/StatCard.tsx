import { Box, Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helperText?: string;
}

export default function StatCard({ label, value, helperText }: StatCardProps) {
  return (
    <Card variant="outlined" sx={{ minWidth: 200, flex: '1 1 200px' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Typography variant="h4" component="div" fontWeight={700}>
            {value}
          </Typography>
        </Box>
        {helperText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {helperText}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
