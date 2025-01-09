// cypress/integration/dashboard.spec.js

describe('Dashboard', () => {
    beforeEach(() => {
      // Assuming we have a custom command for login
      cy.login('testuser@example.com', 'password123');
      cy.visit('/dashboard');
    });
  
    it('should load the dashboard page', () => {
      cy.url().should('include', '/dashboard');
      cy.get('h1').should('contain', 'Dashboard');
    });
  
    it('should display user information', () => {
      cy.get('.user-info').should('contain', 'Welcome, Test User');
    });
  
    it('should show project summary', () => {
      cy.get('.project-summary')
        .should('be.visible')
        .within(() => {
          cy.get('h2').should('contain', 'Project Summary');
          cy.get('.project-count').should('be.visible');
        });
    });
  
    it('should display recent activity', () => {
      cy.get('.recent-activity')
        .should('be.visible')
        .within(() => {
          cy.get('h2').should('contain', 'Recent Activity');
          cy.get('.activity-item').should('have.length.at.least', 1);
        });
    });
  
    it('should navigate to projects page', () => {
      cy.contains('View All Projects').click();
      cy.url().should('include', '/projects');
    });
  
    it('should show performance metrics', () => {
      cy.get('.performance-metrics')
        .should('be.visible')
        .within(() => {
          cy.get('.metric').should('have.length', 3);
        });
    });
  
    it('should allow changing time range for metrics', () => {
      cy.get('select[name="timeRange"]').select('30days');
      cy.get('.loading-indicator').should('be.visible');
      cy.get('.loading-indicator').should('not.exist');
      // Check if metrics have updated - this would depend on your specific implementation
      cy.get('.performance-metrics').should('contain', 'Last 30 Days');
    });
  
    it('should show notifications', () => {
      cy.get('.notification-bell').click();
      cy.get('.notification-panel')
        .should('be.visible')
        .within(() => {
          cy.get('.notification-item').should('have.length.at.least', 1);
        });
    });
  
    it('should allow logging out', () => {
      cy.contains('Logout').click();
      cy.url().should('include', '/login');
    });
  
    it('should handle API errors gracefully', () => {
      // Intercept API call and force an error
      cy.intercept('GET', '/api/dashboard-data', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getDashboardData');
  
      cy.reload();
  
      cy.wait('@getDashboardData');
      cy.get('.error-message').should('contain', 'Failed to load dashboard data');
    });
  
    it('should lazy load charts', () => {
      cy.get('.chart-placeholder').should('be.visible');
      cy.get('.chart', { timeout: 10000 }).should('be.visible');
    });
  
    it('should have working quick action buttons', () => {
      cy.get('.quick-action-button').first().click();
      cy.get('.action-modal').should('be.visible');
    });
  });
  