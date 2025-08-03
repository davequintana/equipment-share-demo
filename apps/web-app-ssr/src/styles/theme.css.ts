import { style } from '@vanilla-extract/css';

export const container = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
});

export const header = style({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '1rem 2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
});

export const nav = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1200px',
  margin: '0 auto',
});

export const logo = style({
  fontSize: '1.5rem',
  fontWeight: 'bold',
});

export const navLinks = style({
  display: 'flex',
  gap: '2rem',
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const navLink = style({
  color: 'white',
  textDecoration: 'none',
  fontWeight: '500',
  transition: 'opacity 0.2s',
  ':hover': {
    opacity: 0.8,
  },
});

export const main = style({
  flex: 1,
  padding: '2rem',
  maxWidth: '1200px',
  margin: '0 auto',
  width: '100%',
});

export const hero = style({
  textAlign: 'center',
  padding: '4rem 0',
});

export const heroTitle = style({
  fontSize: '3rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const heroSubtitle = style({
  fontSize: '1.25rem',
  color: '#666',
  marginBottom: '2rem',
});

export const featuresGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  marginTop: '4rem',
});

export const featureCard = style({
  padding: '2rem',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb',
  transition: 'transform 0.2s, box-shadow 0.2s',
  ':hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
  },
});

export const featureIcon = style({
  fontSize: '2.5rem',
  marginBottom: '1rem',
});

export const featureTitle = style({
  fontSize: '1.25rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
});

export const featureDescription = style({
  color: '#666',
  lineHeight: 1.6,
});

export const button = style({
  padding: '0.75rem 2rem',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '1rem',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  textDecoration: 'none',
  display: 'inline-block',
  ':hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  ':active': {
    transform: 'translateY(0)',
  },
});

export const secondaryButton = style([
  button,
  {
    background: 'transparent',
    color: '#667eea',
    border: '2px solid #667eea',
    ':hover': {
      background: '#667eea',
      color: 'white',
    },
  },
]);

export const authForm = style({
  maxWidth: '400px',
  margin: '2rem auto',
  padding: '2rem',
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb',
});

export const formGroup = style({
  marginBottom: '1.5rem',
});

export const label = style({
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: '#374151',
});

export const input = style({
  width: '100%',
  padding: '0.75rem',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '1rem',
  transition: 'border-color 0.2s',
  ':focus': {
    outline: 'none',
    borderColor: '#667eea',
  },
});

export const errorMessage = style({
  color: '#ef4444',
  fontSize: '0.875rem',
  marginTop: '0.5rem',
});

export const successMessage = style({
  color: '#10b981',
  fontSize: '0.875rem',
  marginTop: '0.5rem',
});
