// e2e/environment.js
const {
  DetoxCircusEnvironment,
  SpecReporter,
  WorkerAssignReporter,
} = require('detox/runners/jest-circus');

class CustomDetoxEnvironment extends DetoxCircusEnvironment {
  constructor(config) {
    super(config);

    // Este reporter é útil para ver o progresso dos testes em tempo real
    this.registerListeners({
      SpecReporter,
      WorkerAssignReporter,
    });
  }
}

module.exports = CustomDetoxEnvironment;