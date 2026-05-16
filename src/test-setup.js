// Global mocks for runtime-injected classes used by template logic
// These must be set before any logic.ts module is imported.
global.TemplateLogic = class TemplateLogic {
    async init(data) { return { state: {} }; }
    async trigger(data, request, state) { return {}; }
};
global.EngineResponse = class EngineResponse {
    constructor() { this.result = null; }
};
global.InitResponse = class InitResponse {
    constructor() { this.state = null; }
};
