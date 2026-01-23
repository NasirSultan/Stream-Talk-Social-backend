"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_js_1 = __importDefault(require("./app.js"));
const database_js_1 = __importDefault(require("./config/database.js"));
dotenv_1.default.config();
const startServer = async () => {
    await (0, database_js_1.default)();
    app_js_1.default.listen(process.env.PORT || 3000);
};
startServer();
