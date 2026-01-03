// e2e/environment.js
const { DetoxCircusEnvironment } = require('detox/runners/jest');
const {
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest/testEnvironment/listeners');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config, context) {
    super(config, context);

    // Este reporter é útil para ver o progresso dos testes em tempo real
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

module.exports = CustomDetoxEnvironment;
