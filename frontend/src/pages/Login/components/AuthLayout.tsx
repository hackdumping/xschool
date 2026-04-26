import React from 'react';
import {
    Box,
    Container,
    Paper,
    alpha,
    useTheme,
    Typography,
} from '@mui/material';
import { useSchool } from '@/contexts/SchoolContext';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const theme = useTheme();
    const { settings } = useSchool();

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: theme.palette.mode === 'light' ? '#ffffff' : '#000000',
                p: 2,
            }}
        >
            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: { xs: 4, sm: 6 },
                        overflow: 'hidden',
                        backgroundColor: theme.palette.mode === 'light' ? '#ffffff' : '#141414',
                        border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.1 : 0.2)}`,
                        boxShadow: theme.palette.mode === 'light'
                            ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <Box sx={{ p: { xs: 3, sm: 6 } }}>
                        {/* Header Section */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Box
                                sx={{
                                    width: 140,
                                    height: 140,
                                    mx: 'auto',
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box 
                                    component="img"
                                    src={settings.logo || '/logo.png'}
                                    alt="Logo"
                                    sx={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </Box>
                            <Typography
                                variant="h3"
                                sx={{
                                    fontWeight: 800,
                                    letterSpacing: '-0.02em',
                                    background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    mb: 1,
                                    fontSize: { xs: '2rem', sm: '2.5rem' }
                                }}
                            >
                                {title}
                            </Typography>
                            {subtitle && (
                                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>

                        {/* Form Content */}
                        {children}
                    </Box>
                </Paper>

                {/* Footer info (optional) */}
                <Typography
                    variant="caption"
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        mt: 4,
                        color: theme.palette.mode === 'light' ? 'text.secondary' : 'grey.600',
                        fontWeight: 500
                    }}
                >
                    &copy; {new Date().getFullYear()} {settings.name} System. All rights reserved.
                </Typography>
            </Container>
        </Box>
    );
};
