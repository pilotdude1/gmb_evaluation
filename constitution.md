# Customer Acquisition & Retention SaaS Constitution

## Project Overview
Enhance the existing GMB Evaluation CRM system to become a comprehensive customer acquisition and retention platform for service-based businesses.

## Core Principles

### 1. **Preserve Existing Architecture**
- **Multi-tenant Foundation**: Maintain current tenant-based isolation and RLS policies
- **Supabase Integration**: Respect existing authentication, database schema, and edge functions
- **SvelteKit Frontend**: Build upon current component architecture and routing
- **Type Safety**: Maintain TypeScript definitions in `database.types.ts`

### 2. **Database Schema Respect**
- **Existing Tables**: Never break compatibility with current CRM tables
- **Additive Changes**: Only add new fields, tables, or features - never modify existing ones destructively
- **Current Relationships**: Preserve all foreign key relationships and constraints
- **Search Vectors**: Maintain existing full-text search functionality

### 3. **Authentication & Security Standards**
- **Enhanced Security**: Continue current security practices from `supabaseClient.ts`
- **PKCE Flow**: Maintain existing auth flow configuration
- **Input Validation**: Use existing validation patterns (`validateEmail`, `validatePassword`)
- **Rate Limiting**: Respect current security measures

### 4. **AI-First Enhancement Strategy**
- **Intelligent Lead Scoring**: Enhance existing `lead_score` fields with AI-powered algorithms
- **Automated Data Enrichment**: Build upon existing GMB data collection
- **Smart Campaign Management**: Enhance existing campaign system with AI optimization
- **Predictive Analytics**: Add AI insights to existing activity tracking

### 5. **Integration Requirements**
- **External Tools**: Integrate with n8n, Make.com, ClickUp, Apify while preserving current architecture
- **MCP Servers**: Implement Model Context Protocol for seamless AI integration
- **API Compatibility**: Maintain existing API endpoints and add new ones incrementally

### 6. **Development Standards**
- **Testing**: Maintain current Playwright test coverage and add tests for new features
- **Documentation**: Update existing markdown files and create new feature documentation
- **Docker**: Respect existing containerization and deployment strategies
- **Environment Variables**: Use current `.env` pattern for new configuration

### 7. **Business Logic Constraints**
- **Service Business Focus**: Target healthcare, trades, professional services, financial advisors
- **Customer Lifecycle**: Support full journey from prospect identification to retention
- **Industry Customization**: Leverage existing industry fields for sector-specific features
- **ROI Tracking**: Build upon existing deal tracking for customer acquisition cost analysis

## Technical Implementation Guidelines

### Database Enhancements
- **New Tables**: Add prefixed tables like `ai_lead_scores`, `automation_workflows`, `external_integrations`
- **Schema Evolution**: Use Supabase migrations to track all changes
- **Backward Compatibility**: Ensure existing queries continue working

### Frontend Development
- **Component Reuse**: Leverage existing components from `src/lib/components`
- **Route Structure**: Follow current routing patterns in `src/routes`
- **Styling**: Maintain Tailwind CSS consistency
- **State Management**: Use existing patterns for data flow

### API Development
- **Endpoint Consistency**: Follow existing API patterns in `src/routes/api`
- **Error Handling**: Use current error response formats
- **Authentication**: Integrate with existing auth middleware
- **Rate Limiting**: Implement using current security patterns

### Integration Architecture
- **n8n Workflows**: Design workflows that read from and write to current CRM tables
- **Make.com Scenarios**: Create automations that enhance existing processes
- **ClickUp Sync**: Map existing CRM data to ClickUp structures
- **Apify Integration**: Enhance current GMB data collection workflows

## Success Metrics
- **Zero Breaking Changes**: All existing functionality must continue working
- **Progressive Enhancement**: Each new feature should add value without disrupting current users
- **Performance Maintenance**: New features should not degrade existing query performance
- **Test Coverage**: Maintain or improve current test coverage percentage

## Migration Strategy
1. **Document Current State**: Create specifications for existing successful patterns
2. **Enhance Incrementally**: Add AI features as extensions to current system
3. **Validate Compatibility**: Ensure each change maintains backward compatibility
4. **User Experience**: Preserve existing user workflows while adding new capabilities

This constitution ensures that GitHub Spec Kit enhances your existing investment while transforming it into a next-generation AI-powered customer acquisition and retention platform.
