import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page when not logged in', () => {
  render(<App />);
  const linkElement = screen.getByText(/PeopleGrid/i);
  expect(linkElement).toBeInTheDocument();
});
