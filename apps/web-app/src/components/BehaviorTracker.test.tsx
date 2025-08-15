import { render, screen } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';
import { BehaviorTracker, withBehaviorTracking } from './BehaviorTracker';

// Mock the useBehaviorTracker hook
const mockTrackPageView = vi.fn();
const mockGetQueueLength = vi.fn();

vi.mock('../hooks/useBehaviorTracker', () => ({
  useBehaviorTracker: vi.fn(() => ({
    trackPageView: mockTrackPageView,
    getQueueLength: mockGetQueueLength,
  })),
}));

describe('BehaviorTracker', () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    mockGetQueueLength.mockReturnValue(0);
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<BehaviorTracker />);
      expect(container.firstChild).toBeNull(); // Component renders null
    });

    it('should not render any visible content', () => {
      render(<BehaviorTracker />);
      // Component should not add any visible DOM elements
      expect(document.body.textContent).toBe('');
    });
  });

  describe('Hook Integration', () => {
    it('should render with default options', () => {
      const { container } = render(<BehaviorTracker />);
      expect(container.firstChild).toBeNull(); // Component renders null
    });

    it('should render with custom options', () => {
      const customOptions = {
        trackPageViews: false,
        trackClicks: false,
        trackMouseMovement: false,
        trackScrolling: false,
        trackKeyboard: true,
        throttleMs: 500,
        batchSize: 25,
        flushIntervalMs: 20000,
      };

      const { container } = render(<BehaviorTracker options={customOptions} />);
      expect(container.firstChild).toBeNull(); // Component renders null
    });

    it('should respect enableMouseTracking prop', () => {
      const { container } = render(<BehaviorTracker enableMouseTracking={false} />);
      expect(container.firstChild).toBeNull(); // Component renders null
    });

    it('should respect enableKeyboardTracking prop', () => {
      const { container } = render(<BehaviorTracker enableKeyboardTracking={true} />);
      expect(container.firstChild).toBeNull(); // Component renders null
    });
  });

  describe('Page View Tracking', () => {
    it('should track initial page view on mount', () => {
      render(<BehaviorTracker />);

      expect(mockTrackPageView).toHaveBeenCalledTimes(1);
    });

    it('should track page view when component re-mounts', () => {
      const { unmount } = render(<BehaviorTracker />);
      expect(mockTrackPageView).toHaveBeenCalledTimes(1);

      unmount();
      render(<BehaviorTracker />);
      expect(mockTrackPageView).toHaveBeenCalledTimes(2);
    });
  });

  describe('Debug Logging', () => {
    it('should set up debug logging interval', () => {
      mockGetQueueLength.mockReturnValue(5);

      render(<BehaviorTracker />);

      // Fast-forward 30 seconds to trigger debug log
      vi.advanceTimersByTime(30000);

      // Verify the interval was set up and getQueueLength was called
      expect(mockGetQueueLength).toHaveBeenCalled();
    });

    it('should continue logging periodically while component is mounted', () => {
      mockGetQueueLength.mockReturnValue(3);

      render(<BehaviorTracker />);

      // Fast-forward multiple intervals
      vi.advanceTimersByTime(30000); // First interval
      vi.advanceTimersByTime(30000); // Second interval
      vi.advanceTimersByTime(30000); // Third interval

      // Should have checked queue length multiple times
      expect(mockGetQueueLength).toHaveBeenCalledTimes(3);
    });

    it('should stop logging when component unmounts', () => {
      mockGetQueueLength.mockReturnValue(2);

      const { unmount } = render(<BehaviorTracker />);

      // Fast-forward and confirm logging works
      vi.advanceTimersByTime(30000);
      const callCountAfterMount = mockGetQueueLength.mock.calls.length;

      // Unmount component
      unmount();

      // Fast-forward again - should not check queue anymore
      vi.advanceTimersByTime(30000);
      expect(mockGetQueueLength).toHaveBeenCalledTimes(callCountAfterMount); // No additional calls
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle multiple mount/unmount cycles', () => {
      // First mount
      const { unmount: unmount1 } = render(<BehaviorTracker />);
      expect(mockTrackPageView).toHaveBeenCalledTimes(1);
      unmount1();

      // Second mount
      const { unmount: unmount2 } = render(<BehaviorTracker />);
      expect(mockTrackPageView).toHaveBeenCalledTimes(2);
      unmount2();

      // Third mount
      render(<BehaviorTracker />);
      expect(mockTrackPageView).toHaveBeenCalledTimes(3);
    });

    it('should cleanup intervals on unmount', () => {
      const { unmount } = render(<BehaviorTracker />);

      // Verify interval is running
      mockGetQueueLength.mockReturnValue(1);
      vi.advanceTimersByTime(30000);
      const callsBeforeUnmount = mockGetQueueLength.mock.calls.length;

      // Unmount and verify cleanup
      unmount();
      vi.advanceTimersByTime(30000);
      expect(mockGetQueueLength).toHaveBeenCalledTimes(callsBeforeUnmount); // No additional calls
    });
  });

  describe('Props Validation', () => {
    it('should handle undefined options gracefully', () => {
      const { container } = render(<BehaviorTracker options={undefined} />);
      expect(container.firstChild).toBeNull(); // Component renders null
    });

    it('should handle partial options', () => {
      const { container } = render(
        <BehaviorTracker
          options={{
            throttleMs: 1000,
            batchSize: 50,
          }}
        />
      );
      expect(container.firstChild).toBeNull(); // Component renders null
    });

    it('should handle boolean props correctly', () => {
      const { container } = render(
        <BehaviorTracker
          enableMouseTracking={false}
          enableKeyboardTracking={true}
        />
      );
      expect(container.firstChild).toBeNull(); // Component renders null
    });
  });
});

describe('withBehaviorTracking HOC', () => {
  // Test component for HOC testing
  const TestComponent: React.FC<{ title: string }> = ({ title }) => (
    <div data-testid="test-component">{title}</div>
  );

  TestComponent.displayName = 'TestComponent';

  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Wrapping', () => {
    it('should wrap component with BehaviorTracker', () => {
      const WrappedComponent = withBehaviorTracking(TestComponent);

      render(<WrappedComponent title="Test Title" />);

      // Should render the original component
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();

      // Should initialize behavior tracking
      expect(mockTrackPageView).toHaveBeenCalledTimes(1);
    });

    it('should pass through all props to wrapped component', () => {
      const WrappedComponent = withBehaviorTracking(TestComponent);

      render(<WrappedComponent title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should set correct displayName', () => {
      const WrappedComponent = withBehaviorTracking(TestComponent);

      expect(WrappedComponent.displayName).toBe('withBehaviorTracking(TestComponent)');
    });

    it('should handle component without displayName', () => {
      const AnonymousComponent: React.FC = () => <div>Anonymous</div>;

      const WrappedComponent = withBehaviorTracking(AnonymousComponent);

      expect(WrappedComponent.displayName).toBe('withBehaviorTracking(AnonymousComponent)');
    });

    it('should apply custom tracker options', () => {
      const customOptions = {
        trackPageViews: false,
        throttleMs: 500,
        batchSize: 30,
      };

      const WrappedComponent = withBehaviorTracking(TestComponent, customOptions);

      render(<WrappedComponent title="Test" />);

      // Should render the wrapped component
      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Multiple Wrapped Components', () => {
    it('should handle multiple wrapped components independently', () => {
      const Component1 = withBehaviorTracking(TestComponent);
      const Component2 = withBehaviorTracking(TestComponent);

      render(
        <div>
          <Component1 title="Component 1" />
          <Component2 title="Component 2" />
        </div>
      );

      expect(screen.getByText('Component 1')).toBeInTheDocument();
      expect(screen.getByText('Component 2')).toBeInTheDocument();

      // Each component should track page view independently
      expect(mockTrackPageView).toHaveBeenCalledTimes(2);
    });

    it('should handle different options for different components', () => {
      const options1 = { trackClicks: false };
      const options2 = { trackScrolling: false };

      const Component1 = withBehaviorTracking(TestComponent, options1);
      const Component2 = withBehaviorTracking(TestComponent, options2);

      render(
        <div>
          <Component1 title="Component 1" />
          <Component2 title="Component 2" />
        </div>
      );

      expect(screen.getByText('Component 1')).toBeInTheDocument();
      expect(screen.getByText('Component 2')).toBeInTheDocument();

      // Each component should track page view independently
      expect(mockTrackPageView).toHaveBeenCalledTimes(2);
    });
  });

  describe('TypeScript Integration', () => {
    it('should preserve component prop types', () => {
      interface CustomProps {
        id: number;
        name: string;
        optional?: boolean;
      }

      const TypedComponent: React.FC<CustomProps> = ({ id, name, optional }) => (
        <div>
          {id} - {name} - {optional ? 'yes' : 'no'}
        </div>
      );

      const WrappedComponent = withBehaviorTracking(TypedComponent);

      // TypeScript should enforce correct props
      render(
        <WrappedComponent
          id={123}
          name="Test Name"
          optional={true}
        />
      );

      expect(screen.getByText('123 - Test Name - yes')).toBeInTheDocument();
    });
  });

  describe('Performance Considerations', () => {
    it('should not re-render excessively', () => {
      const renderCount = vi.fn();

      const CountingComponent: React.FC<{ value: number }> = ({ value }) => {
        renderCount();
        return <div>{value}</div>;
      };

      const WrappedComponent = withBehaviorTracking(CountingComponent);

      const { rerender } = render(<WrappedComponent value={1} />);
      expect(renderCount).toHaveBeenCalledTimes(1);

      rerender(<WrappedComponent value={2} />);
      expect(renderCount).toHaveBeenCalledTimes(2);

      rerender(<WrappedComponent value={2} />); // Same props
      expect(renderCount).toHaveBeenCalledTimes(3); // Still re-renders (expected behavior)
    });

    it('should handle rapid mount/unmount cycles', () => {
      const WrappedComponent = withBehaviorTracking(TestComponent);

      // Rapidly mount and unmount
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<WrappedComponent title={`Test ${i}`} />);
        unmount();
      }

      // Should have tracked page view for each mount
      expect(mockTrackPageView).toHaveBeenCalledTimes(10);
    });
  });
});
