# User Behavior Tracking System

A comprehensive Kafka-based user behavior analytics system that captures detailed user interactions and sends them to your analytics pipeline. This system now includes automatic initialization, ReDoS protection, and enhanced security features.

## 🎯 Features

### Frontend Tracking

- **Page Views**: Automatic route change detection with initialization tracking
- **Mouse Interactions**: Clicks with element targeting and coordinates
- **Mouse Movement**: Throttled tracking for heat maps (configurable throttling)
- **Scroll Behavior**: Scroll position tracking
- **Keyboard Events**: Safe key tracking (navigation keys only for privacy)
- **Focus/Blur**: Window focus state changes
- **ReDoS Protection**: Built-in protection against Regular Expression Denial of Service attacks
- **Null Safety**: Comprehensive null checking and error handling

### Backend Processing

- **Kafka Integration**: Real-time event streaming with producer optimization
- **Session Management**: User session tracking with configurable auto-logout
- **Rich Metadata**: Enhanced event data with context and timestamp information
- **Batch Processing**: Efficient event batching and flushing with configurable sizes
- **Error Recovery**: Automatic retry logic and graceful degradation

## 🚀 Quick Start

### 1. Enable Behavior Tracking in Your App

```tsx
import { BehaviorTracker } from '../components/BehaviorTracker';

function App() {
  const { user } = useAuth();

  return (
    <div>
      {/* Enable tracking for authenticated users */}
      {user && (
        <BehaviorTracker 
          enableMouseTracking={true}
          enableKeyboardTracking={false}  // Disabled by default for privacy
          options={{
            trackPageViews: true,
            trackClicks: true,
            trackMouseMovement: true,
            trackScrolling: true,
            trackKeyboard: false,  // Privacy-first approach
            throttleMs: 100,       // Optimized for performance
            batchSize: 10,         // Efficient batching
            flushIntervalMs: 5000, // 5-second intervals
          }}
        />
      )}
      {/* Your app content */}
    </div>
  );
}
      {/* Your app content */}
    </div>
  );
}
```

### 2. Custom Event Tracking

```tsx
import { useBehaviorTracker } from '../hooks/useBehaviorTracker';

function MyComponent() {
  const { trackPageView, flushEvents } = useBehaviorTracker();

  const handleSpecialAction = () => {
    // Track custom page view
    trackPageView('/special-action');
    
    // Force flush events
    flushEvents();
  };

  return <button onClick={handleSpecialAction}>Special Action</button>;
}
```

### 3. Advanced Integration with HOC

```tsx
import { withBehaviorTracking } from '../components/BehaviorTracker';

const MyPage = () => {
  return <div>My tracked page content</div>;
};

// Wrap component with behavior tracking
export default withBehaviorTracking(MyPage, {
  trackMouseMovement: false, // Disable mouse tracking for this page
  batchSize: 5,
});
```

## 📊 Event Types

### Page View Events
```json
{
  "eventType": "page_view",
  "timestamp": 1640995200000,
  "page": "/dashboard?tab=analytics",
  "metadata": {}
}
```

### Click Events
```json
{
  "eventType": "click",
  "timestamp": 1640995200000,
  "page": "/dashboard",
  "metadata": {
    "x": 250,
    "y": 150,
    "element": "button",
    "target": "submit-btn",
    "text": "Submit Form"
  }
}
```

### Mouse Movement Events
```json
{
  "eventType": "mouse_move",
  "timestamp": 1640995200000,
  "page": "/dashboard",
  "metadata": {
    "x": 320,
    "y": 180
  }
}
```

### Scroll Events
```json
{
  "eventType": "scroll",
  "timestamp": 1640995200000,
  "page": "/dashboard",
  "metadata": {
    "scrollTop": 250,
    "scrollLeft": 0
  }
}
```

### Keyboard Events (Safe Keys Only)
```json
{
  "eventType": "keyboard",
  "timestamp": 1640995200000,
  "page": "/dashboard",
  "metadata": {
    "key": "Enter"
  }
}
```

## ⚙️ Configuration Options

### BehaviorTracker Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trackPageViews` | boolean | `true` | Track route changes and page views |
| `trackClicks` | boolean | `true` | Track mouse click events |
| `trackMouseMovement` | boolean | `true` | Track mouse movement (performance impact) |
| `trackScrolling` | boolean | `true` | Track scroll position changes |
| `trackKeyboard` | boolean | `false` | Track safe keyboard navigation keys |
| `throttleMs` | number | `200` | Throttle interval for mouse/scroll events |
| `batchSize` | number | `15` | Events to batch before auto-flush |
| `flushIntervalMs` | number | `10000` | Auto-flush interval (10 seconds) |

### Performance Tuning

```tsx
// High-traffic page - reduce tracking
<BehaviorTracker options={{
  trackMouseMovement: false,
  throttleMs: 500,
  batchSize: 25,
  flushIntervalMs: 15000,
}} />

// Analytics-heavy page - increase tracking
<BehaviorTracker options={{
  trackMouseMovement: true,
  throttleMs: 100,
  batchSize: 10,
  flushIntervalMs: 5000,
}} />
```

## 🔒 Privacy & Security

### Safe Keyboard Tracking
Only navigation keys are tracked by default:
- `Enter`, `Tab`, `Escape`
- Arrow keys: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`

Sensitive keys (letters, numbers, function keys) are filtered out to protect user privacy.

### ReDoS Protection
All input validation includes protection against Regular Expression Denial of Service attacks:

```typescript
// Safe pattern validation with length limits
const validateInput = (input: string) => {
  if (input.length > 2048) return false; // Length limit
  return safeRegex.test(input); // ReDoS-safe regex
};
```

### Data Minimization
- Mouse coordinates are relative to viewport, not absolute screen position
- Text content is truncated to 100 characters maximum
- Sensitive form data is never captured

## 🔧 Backend Integration

### Kafka Event Schema

```typescript
interface UserActivityEvent {
  userId: string;
  email: string;
  eventType: 'activity' | 'logout';
  timestamp: number;
  sessionId?: string;
  metadata?: {
    action?: string;
    page?: string;
    x?: number;
    y?: number;
    element?: string;
    // ... additional tracking data
  };
}
```

### API Endpoint

```http
POST /api/user/activity
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "action": "click",
  "page": "/dashboard",
  "metadata": {
    "x": 250,
    "y": 150,
    "element": "button",
    "target": "submit-btn"
  }
}
```

## 📈 Analytics Use Cases

### Heat Maps
Track mouse movements and clicks to generate visual heat maps:

```typescript
// Filter for mouse events
const mouseEvents = events.filter(e => 
  e.eventType === 'click' || e.eventType === 'mouse_move'
);

// Generate heat map data
const heatMapData = mouseEvents.map(e => ({
  x: e.metadata.x,
  y: e.metadata.y,
  value: e.eventType === 'click' ? 10 : 1
}));
```

### User Journey Analysis
Track page views to understand user flow:

```typescript
// User session events
const sessionEvents = events
  .filter(e => e.sessionId === targetSessionId)
  .sort((a, b) => a.timestamp - b.timestamp);

// Extract journey
const userJourney = sessionEvents
  .filter(e => e.eventType === 'page_view')
  .map(e => e.page);
```

### Engagement Metrics
Calculate time spent on pages and interaction rates:

```typescript
// Page dwell time
const dwellTime = calculateTimeBetweenEvents(
  pageViewEvent,
  nextPageViewEvent
);

// Interaction rate per page
const interactions = events.filter(e => 
  e.page === targetPage && e.eventType === 'click'
).length;
```

## 🚨 Testing

### Unit Tests
```bash
pnpm test apps/web-app/src/hooks/useBehaviorTracker.test.ts
```

### Integration Tests
```bash
pnpm run test:e2e -- --grep "behavior tracking"
```

### Performance Tests
```typescript
it('should handle 1000 rapid events without blocking', () => {
  const startTime = Date.now();
  
  for (let i = 0; i < 1000; i++) {
    trackPageView(`/page-${i}`);
  }
  
  const endTime = Date.now();
  expect(endTime - startTime).toBeLessThan(100);
});
```

## 🔍 Monitoring

### Debug Mode
Enable debug logging in development:

```typescript
// Logs queue length every 30 seconds
const { getQueueLength } = useBehaviorTracker();

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    const interval = setInterval(() => {
      console.debug(`Queue length: ${getQueueLength()}`);
    }, 30000);
    return () => clearInterval(interval);
  }
}, []);
```

### Kafka Monitoring
View events in real-time:

```bash
# Kafka UI
http://localhost:8080

# Console consumer
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user-activity \
  --from-beginning
```

## 🎛️ Advanced Configuration

### Custom Event Types
## 🧪 Testing

### Comprehensive Test Coverage

The behavior tracking system includes comprehensive tests that verify:

- **Automatic Page View Tracking**: Tests verify that page views are automatically tracked on hook initialization
- **Event Batching**: Tests confirm proper batching behavior and automatic flushing when batch size is reached
- **ReDoS Protection**: Specialized tests ensure the system handles malicious regex patterns safely
- **Error Handling**: Tests verify graceful degradation when API calls fail
- **Performance**: Tests confirm throttling works correctly for high-frequency events

### Unit Tests

```bash
# Run behavior tracker tests
pnpm nx test web-app --testNamePattern="useBehaviorTracker"

# Run all tests including coverage
pnpm run test:all
```

### ReDoS Security Testing

All regex patterns are tested with malicious inputs that could cause exponential backtracking:

```typescript
it('should handle ReDoS attack patterns safely', () => {
  const maliciousPatterns = [
    'a'.repeat(10000),
    '((a+)+)+b',
    'user@' + 'a'.repeat(5000) + '.com'
  ];
  
  const startTime = Date.now();
  maliciousPatterns.forEach(pattern => {
    validateInput(pattern);
  });
  const endTime = Date.now();
  
  // Must complete under 100ms even with attack patterns
  expect(endTime - startTime).toBeLessThan(100);
});
```

## 🔧 Advanced Configuration

### Custom Event Types

Extend the system with custom events:

```typescript
// Add custom event type
type CustomEventType = 'form_submit' | 'file_download' | 'video_play';

// Track custom events
const trackCustomEvent = (eventType: CustomEventType, metadata: any) => {
  apiClient.trackActivity(user.id, eventType, getCurrentPage(), metadata);
};
```

### Conditional Tracking

Enable tracking based on user preferences:

```typescript
const { preferences } = useUserPreferences();

<BehaviorTracker 
  options={{
    trackMouseMovement: preferences.allowMouseTracking,
    trackClicks: preferences.allowClickTracking,
  }}
/>
```

## 📋 Best Practices

1. **Performance**: Disable mouse tracking on mobile devices for better battery life
2. **Privacy**: Always inform users about tracking in your privacy policy
3. **Data Retention**: Implement data retention policies for GDPR compliance
4. **Batching**: Use appropriate batch sizes for your traffic volume (default: 10 events)
5. **Error Handling**: Never let tracking errors disrupt user experience
6. **Testing**: Always test with ReDoS protection patterns and malicious inputs
7. **Security**: Regular expression patterns must be ReDoS-safe
8. **Null Safety**: All event handlers include comprehensive null checking

## 🔗 Related Documentation

- [Kafka Setup Guide](../docs/kafka-setup.md)
- [API Authentication](../docs/authentication.md)
- [Privacy Policy Template](../docs/privacy-policy.md)
- [Performance Monitoring](../docs/monitoring.md)
