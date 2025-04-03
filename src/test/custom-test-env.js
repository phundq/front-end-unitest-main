const Environment = require("jest-environment-jsdom");

class CustomEnvironment extends Environment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();

    if (typeof this.global.TextEncoder === "undefined") {
      const { TextEncoder } = require("util");
      this.global.TextEncoder = TextEncoder;
    }
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = CustomEnvironment;
