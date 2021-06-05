"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Express = require("express");
exports.default = () => {
    const app = Express();
    app.get('/', (_req, res) => res.send('Server is up.'));
    Express.application.listen(3000);
};
//# sourceMappingURL=keep-alive.js.map