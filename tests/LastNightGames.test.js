/**
 * @jest-environment jsdom
 */


// tests.js

// Import necessary testing libraries and functions
import { render, screen, waitFor, act } from '@testing-library/react';
import { extendExpect } from '@testing-library/jest-dom';
import LastNightGames from '../assets/components/LastNightGames'; // Assuming this is the correct file path

import React, { useState, useEffect } from 'react';

// Mock the fetch function for a successful response
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [{ matchup: 'TeamA vs TeamB', awayScore: 3, homeScore: 2 }] }),
  })
);

// Mock the passage of time
jest.useFakeTimers();

// Test: Initial Rendering
test('renders without crashing', () => {
  render(<LastNightGames />);
});

// Test: Data Fetching
test('fetches and displays data', async () => {
  render(<LastNightGames />);
  // You may need to wait for the component to update (e.g., using `waitFor`)
  await waitFor(() => {
    expect(screen.getByText('TeamA vs TeamB')).toBeInTheDocument();
    expect(screen.getByText('3 - 2')).toBeInTheDocument();
  });
});

// Test: Interval Update
test('fetches and updates data at the expected interval', async () => {
  render(<LastNightGames />);
  // Advance time by 10 seconds (matching the interval in the component)
  act(() => {
    jest.advanceTimersByTime(10000);
  });
  // Verify that the component has updated
  // You may need to wait for the component to update (e.g., using `waitFor`)
  await waitFor(() => {
    // Add assertions for updated data
  });
});

// Test: Cleanup
test('clears interval on unmount', () => {
  const clearIntervalSpy = jest.spyOn(window, 'clearInterval'); // Mock clearInterval

  const { unmount } = render(<LastNightGames />);

  // Unmount the component
  unmount();

  // Verify that the mock clearInterval has been called
  expect(clearIntervalSpy).toHaveBeenCalled();

  // Restore the original implementation of clearInterval
  clearIntervalSpy.mockRestore();
}); 
