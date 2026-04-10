import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  // Edit as EditIcon,
  // Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { useEffect } from 'react';
import { agendaService } from '@/services/api';
import { LinearProgress } from '@mui/material';
import type { CalendarEvent, EventType } from '@/types';
import { useNotification } from '@/contexts/NotificationContext';

const getEventColor = (type: EventType) => {
  switch (type) {
    case 'exam':
      return '#D32F2F';
    case 'meeting':
      return '#1976D2';
    case 'holiday':
      return '#388E3C';
    case 'activity':
      return '#F57C00';
    default:
      return '#757575';
  }
};

const getEventLabel = (type: EventType) => {
  switch (type) {
    case 'exam':
      return 'Examen';
    case 'meeting':
      return 'Réunion';
    case 'holiday':
      return 'Vacances';
    case 'activity':
      return 'Activité';
    default:
      return 'Autre';
  }
};

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const CalendarPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showNotification } = useNotification();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventsList, setEventsList] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await agendaService.getEvents();
        setEventsList(response.data);
      } catch (error: any) {
        console.error('Failed to fetch events', error);
        const msg = error.response?.data?.detail || error.message || 'Erreur inconnue';
        showNotification(`Erreur lors du chargement de l'agenda: ${msg}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [showNotification]);

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'other' as EventType,
    startDate: new Date(),
    endDate: new Date(),
    allDay: true,
  });

  // Helper functions
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    try {
      const dateStr = date.toISOString().split('T')[0];
      return eventsList.filter(event => {
        try {
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return false;
          }

          const eventStart = startDate.toISOString().split('T')[0];
          const eventEnd = endDate.toISOString().split('T')[0];
          return dateStr >= eventStart && dateStr <= eventEnd;
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      return [];
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
          Chargement de l'agenda...
        </Typography>
      </Box>
    );
  }

  const calendarDays = generateCalendarDays();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddEvent = (date?: Date) => {
    setSelectedEvent(null);
    setNewEvent({
      title: '',
      description: '',
      type: 'other',
      startDate: date ? new Date(date) : new Date(),
      endDate: date ? new Date(date) : new Date(),
      allDay: true,
    });
    setOpenDialog(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      type: event.type,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      allDay: event.allDay,
    });
    setOpenDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!newEvent.title.trim()) {
      showNotification('Veuillez saisir un titre', 'error');
      return;
    }

    try {
      const payload = {
        ...newEvent,
        startDate: newEvent.startDate.toISOString(),
        endDate: newEvent.endDate.toISOString(),
      };

      if (selectedEvent) {
        await agendaService.updateEvent(selectedEvent.id, payload);
        showNotification('Événement modifié avec succès', 'success');
      } else {
        await agendaService.createEvent(payload);
        showNotification('Événement créé avec succès', 'success');
      }
      setOpenDialog(false);
      // Refresh
      const response = await agendaService.getEvents();
      setEventsList(response.data);
    } catch (error: any) {
      console.error('Failed to save event', error);
      const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      showNotification(`Erreur lors de l'enregistrement: ${msg}`, 'error');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await agendaService.deleteEvent(eventId);
      showNotification('Événement supprimé', 'warning');
      setOpenDialog(false);
      // Refresh
      const response = await agendaService.getEvents();
      setEventsList(response.data);
    } catch (error) {
      console.error('Failed to delete event', error);
      showNotification('Erreur lors de la suppression de l\'événement', 'error');
    }
  };

  // Agenda View for Mobile
  const renderAgendaView = () => {
    const daysWithEvents = calendarDays
      .filter(date => date !== null)
      .map(date => ({
        date: date as Date,
        events: getEventsForDay(date)
      }))
      .filter(day => day.events.length > 0);

    if (daysWithEvents.length === 0) {
      return (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          Aucun événement ce mois-ci
        </Box>
      );
    }

    return (
      <List sx={{ p: 0 }}>
        {daysWithEvents.map((day, idx) => (
          <React.Fragment key={idx}>
            <ListItem sx={{ bgcolor: 'action.hover', py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {day.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Typography>
            </ListItem>
            {day.events.map(event => (
              <ListItem
                key={event.id}
                sx={{ borderBottom: '1px solid #eee' }}
                onClick={() => handleEditEvent(event)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: getEventColor(event.type), width: 32, height: 32 }}>
                    <TodayIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={event.title}
                  secondary={event.description || getEventLabel(event.type)}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Agenda Scolaire
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {eventsList.length} événements programmés
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleAddEvent()}
          sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}
        >
          Nouveau
        </Button>
      </Box>

      {/* Calendar Navigation */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrevMonth}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 600, minWidth: { xs: 150, sm: 200 }, textAlign: 'center', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', md: 'auto' }, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              fullWidth={{ xs: true, md: false } as any}
              startIcon={<TodayIcon />}
              onClick={handleToday}
            >
              Aujourd'hui
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {isMobile ? (
          renderAgendaView()
        ) : (
          <Box sx={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Box sx={{ minWidth: 800 }}>
              <CardContent sx={{ p: 0 }}>
                {/* Day Headers */}
                <Grid container sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  {DAYS.map((day) => (
                    <Grid
                      key={day}
                      size={{ xs: 12 / 7 }}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'text.secondary',
                      }}
                    >
                      {day}
                    </Grid>
                  ))}
                </Grid>

                {/* Calendar Days */}
                <Grid container>
                  {calendarDays.map((date, index) => {
                    const dayEvents = getEventsForDay(date);

                    return (
                      <Grid
                        key={index}
                        size={{ xs: 12 / 7 }}
                        onClick={() => date && handleAddEvent(date)}
                        sx={{
                          minHeight: 120,
                          p: 1,
                          borderRight: (index + 1) % 7 !== 0 ? 1 : 0,
                          borderBottom: 1,
                          borderColor: 'divider',
                          backgroundColor: date && isToday(date) ? 'primary.container' : 'inherit',
                          cursor: date ? 'pointer' : 'default',
                          '&:hover': date ? { bgcolor: 'action.hover' } : {},
                        }}
                      >
                        {date && (
                          <>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isToday(date) ? 600 : 400,
                                color: isToday(date) ? 'primary.main' : 'text.primary',
                                mb: 1,
                              }}
                            >
                              {date.getDate()}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {dayEvents.slice(0, 3).map((event) => (
                                <Chip
                                  key={event.id}
                                  size="small"
                                  label={event.title}
                                  sx={{
                                    backgroundColor: getEventColor(event.type),
                                    color: 'white',
                                    fontSize: '0.625rem',
                                    height: 20,
                                    cursor: 'pointer',
                                    '&:hover': { opacity: 0.8 },
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditEvent(event);
                                  }}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{dayEvents.length - 3} autres
                                </Typography>
                              )}
                            </Box>
                          </>
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Box>
          </Box>
        )}
      </Card>

      {/* Event Legend */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {(['exam', 'meeting', 'holiday', 'activity', 'other'] as EventType[]).map((type) => (
          <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: 1,
                backgroundColor: getEventColor(type),
              }}
            />
            <Typography variant="caption">{getEventLabel(type)}</Typography>
          </Box>
        ))}
      </Box>

      {/* Event Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedEvent ? 'Modifier l\'événement' : 'Nouvel Événement'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Titre"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                  label="Type"
                >
                  <MenuItem value="exam">Examen</MenuItem>
                  <MenuItem value="meeting">Réunion</MenuItem>
                  <MenuItem value="holiday">Vacances</MenuItem>
                  <MenuItem value="activity">Activité</MenuItem>
                  <MenuItem value="other">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Date de début"
                value={newEvent.startDate}
                onChange={(date) => date && setNewEvent({ ...newEvent, startDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Date de fin"
                value={newEvent.endDate}
                onChange={(date) => date && setNewEvent({ ...newEvent, endDate: date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {selectedEvent && (
            <Button
              color="error"
              onClick={() => {
                handleDeleteEvent(selectedEvent.id);
                setOpenDialog(false);
              }}
            >
              Supprimer
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveEvent}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
