// cypress/support/commands.js

// Custom command for login
Cypress.Commands.add('login', (email, password) => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
  
  // Custom command to check if an element is in viewport
  Cypress.Commands.add('isInViewport', element => {
    cy.get(element).then($el => {
      const bottom = Cypress.$(cy.state('window')).height();
      const rect = $el[0].getBoundingClientRect();
  
      expect(rect.top).not.to.be.greaterThan(bottom);
      expect(rect.bottom).not.to.be.greaterThan(bottom);
      expect(rect.top).not.to.be.greaterThan(bottom);
      expect(rect.bottom).not.to.be.lessThan(0);
    });
  });
  
  // Custom command to drag and drop
  Cypress.Commands.add('dragAndDrop', (subject, target) => {
    Cypress.log({
      name: 'DRAGNDROP',
      message: `Dragging element ${subject} to ${target}`,
      consoleProps: () => {
        return {
          subject: subject,
          target: target
        };
      }
    });
    
    cy.get(subject).trigger('mousedown', { which: 1 });
    cy.get(target).trigger('mousemove').trigger('mouseup', { force: true });
  });
  
  // Custom command to check accessibility
  Cypress.Commands.add('checkA11y', (context, options) => {
    cy.injectAxe();
    cy.checkA11y(context, options);
  });
  
  // Custom command to mock GraphQL requests
  Cypress.Commands.add('mockGraphQL', (operationName, mockData) => {
    cy.intercept('POST', '/graphql', (req) => {
      if (req.body.operationName === operationName) {
        req.reply({ data: mockData });
      }
    });
  });
  
  // Custom command to wait for network idle
  Cypress.Commands.add('waitForNetworkIdle', (timeout = 10000, interval = 100) => {
    let lastResponseTime = Date.now();
  
    cy.intercept('*', () => {
      lastResponseTime = Date.now();
    });
  
    const checkNetworkIdle = () => {
      const now = Date.now();
      if (now - lastResponseTime > interval) {
        return;
      }
      cy.wait(interval);
      checkNetworkIdle();
    };
  
    cy.wrap(null, { timeout }).then(() => checkNetworkIdle());
  });
  
  // Add more custom commands as needed for your application
  