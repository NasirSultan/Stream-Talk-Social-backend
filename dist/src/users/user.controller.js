"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.createUser = void 0;
const model_js_1 = require("../models/model.js");
const createUser = async (req, res) => {
    const user = await model_js_1.User.create(req.body);
    res.status(201).json(user);
};
exports.createUser = createUser;
const getUsers = async (req, res) => {
    const users = await model_js_1.User.find();
    res.json(users);
};
exports.getUsers = getUsers;
