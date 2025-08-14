# Changelog

## Recent Updates (August 2025)

### ✅ Enhanced User Behavior Tracking System

#### Features Added

- **Automatic Page View Tracking**: The `useBehaviorTracker` hook now automatically tracks page views on initialization
- **ReDoS Protection**: Built-in protection against Regular Expression Denial of Service attacks
- **Enhanced Security**: Comprehensive null safety checks and input validation
- **Improved Performance**: Optimized throttling (100ms default) and batching (10 events default)
- **Privacy-First Approach**: Keyboard tracking disabled by default, only safe navigation keys when enabled

#### Testing Improvements

- **Comprehensive Test Coverage**: All behavior tracking functionality now has unit tests
- **ReDoS Security Tests**: Specialized tests to verify protection against malicious regex patterns
- **Performance Tests**: Verification that rapid event generation doesn't block the UI
- **Error Handling Tests**: Ensures graceful degradation when APIs fail

#### Breaking Changes

- Test expectations updated to account for automatic page view tracking on hook initialization
- Behavior tracker now queues 2 events when manually calling `trackPageView()` (1 auto + 1 manual)

### ✅ Development Environment Improvements

#### Updated Prerequisites

- **Node.js**: Updated to 23.6.0+ (Latest LTS)
- **pnpm**: Updated to 9.0.0+
- **React**: Upgraded to React 19 with modern concurrent features
- **ESLint**: Upgraded to ESLint 9 with flat configuration

#### Enhanced Development Commands

- **`pnpm run dev:kafka`**: New command to start full stack including Kafka
- **Improved Hot Reload**: Better development experience with optimized Vite configuration
- **Better Error Handling**: Enhanced error messages and debugging information

### ✅ Security Enhancements

#### ReDoS Protection Implementation

All regular expressions throughout the codebase are now protected against ReDoS attacks:

- **Email Validation**: ReDoS-safe patterns with length limits
- **Input Validation**: Comprehensive protection against exponential backtracking
- **Testing**: Mandatory ReDoS testing for all regex patterns
- **Performance**: All validation must complete under 100ms even with malicious inputs

#### Authentication Improvements

- **Auto-logout**: Enhanced session management with configurable idle timers
- **Session Security**: Improved JWT token handling and validation
- **Rate Limiting**: Better protection against brute force attacks

### ✅ Code Quality Improvements

#### Testing Infrastructure

- **All Tests Passing**: Comprehensive test suite with 56 unit tests and 21 E2E tests
- **Test Fixes**: Resolved behavior tracker test failures by updating expectations
- **Coverage**: Maintained high test coverage across the codebase
- **Modern Testing**: Using Vitest for unit tests and Playwright for E2E

#### Documentation Updates

- **README**: Updated with current technology stack and features
- **User Behavior Tracking**: Enhanced documentation with security features
- **Development Setup**: Updated with latest prerequisites and commands
- **Removed Outdated Files**: Cleaned up obsolete documentation files

### ✅ Performance Optimizations

#### Frontend Optimizations

- **Bundle Size**: Optimized builds with better tree shaking
- **Hot Reload**: Faster development reload times
- **Event Throttling**: Improved performance for high-frequency events
- **Memory Management**: Better cleanup in behavior tracking hooks

#### Backend Optimizations

- **Kafka Integration**: Optimized producer configuration for better throughput
- **Database Queries**: Improved connection pooling and query optimization
- **API Performance**: Enhanced Fastify configuration for better response times

## Technical Stack Updates

### Current Technology Stack

- **Frontend**: React 19, TypeScript, Vanilla Extract, Vite
- **Backend**: Fastify 5, JWT Auth, OpenAPI/Swagger, Kafka Integration
- **Database**: PostgreSQL, Redis, Apache Kafka
- **Testing**: Playwright E2E, Vitest Unit Tests, ESLint 9
- **Infrastructure**: Docker, Kubernetes, AWS CloudFormation
- **Tooling**: NX Monorepo, pnpm, Node.js 23.6.0

### Security Features

- **Modern Authentication**: bcrypt, JWT tokens, auto-logout, session management
- **User Analytics**: Real-time Kafka event streaming with privacy protection
- **Input Validation**: ReDoS protection, CORS, rate limiting
- **Error Handling**: Comprehensive error boundaries and graceful degradation

## Migration Notes

### For Developers

1. **Node.js**: Update to 23.6.0 or later
2. **pnpm**: Update to 9.0.0 or later
3. **Tests**: Update any behavior tracker tests to account for automatic page view tracking
4. **Development**: Use `pnpm run dev:kafka` for full-stack development with analytics

### For Testing

1. **ReDoS Tests**: All new regex patterns must include ReDoS protection tests
2. **Behavior Tracking**: Update test expectations for automatic initialization tracking
3. **Performance**: Ensure all validation completes under 100ms

### For Deployment

1. **Environment Variables**: Review and update environment configuration
2. **Kafka**: Ensure Kafka topics are properly configured for production
3. **Security**: Verify all ReDoS protections are in place
