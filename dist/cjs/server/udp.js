"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UDPServer = void 0;
const node_events_1 = __importDefault(require("node:events"));
const node_dgram_1 = require("node:dgram");
const node_crypto_1 = require("node:crypto");
const __1 = require("..");
const error_1 = __importDefault(require("../error"));
const logger_1 = require("../logger");
class UDPServer extends node_events_1.default {
    #socket;
    #sessionEmitter;
    #plugins = [];
    serviceName;
    constructor({ socketType = 'udp4', serviceName, } = {}) {
        // rome-ignore lint/correctness/noInvalidConstructorSuper:
        super();
        this.#socket = (0, node_dgram_1.createSocket)(socketType);
        this.#sessionEmitter = new node_events_1.default();
        this.serviceName = serviceName;
    }
    usePlugin(Plugin, pluginOptions, enableLog = true) {
        const plugin = new Plugin(this, pluginOptions);
        if (plugin.extendServerClass)
            plugin.extendServerClass(this);
        if (plugin.onReady)
            this.on('ready', plugin.onReady);
        if (plugin.onMessage)
            this.on('message', async (message) => {
                if (plugin.extendMessageClass)
                    await plugin.extendMessageClass(message);
                if (plugin.onMessage)
                    plugin.onMessage(message);
            });
        this.#plugins.push(plugin);
        if (enableLog)
            (0, logger_1.rkLog)(`Plugin ${(0, logger_1.rkColor)(plugin.constructor.name)} enabled!`);
        return plugin;
    }
    async start(port = 3000, address, enableLog = true) {
        this.#socket.on('message', (msg, remoteInfo) => {
            const { event, data } = JSON.parse(msg.toString('utf-8'));
            if (event.startsWith('reply:')) {
                return this.#sessionEmitter.emit(event.slice('reply:'.length), data);
            }
            switch (event) {
                case 'message':
                    this.emit('message', new __1.Message(this, remoteInfo, data));
                    break;
            }
        });
        await new Promise((res) => this.#socket.bind(port, address, () => res()));
        if (enableLog)
            (0, logger_1.readyLog)(this.serviceName, port);
        this.emit('ready', port);
    }
    async sendEvent(info, event, data, timeout = 60000) {
        return new Promise((res) => {
            const session = (0, node_crypto_1.randomUUID)();
            const encodedData = encodeURIComponent(JSON.stringify({ event, session, data }));
            const t = setTimeout(() => {
                throw new error_1.default(error_1.default.TIMEOUT);
            }, timeout);
            const handler = (success) => {
                res(success);
                clearTimeout(t);
                this.#sessionEmitter.off(session, handler);
            };
            this.#sessionEmitter.on(session, handler);
            this.#socket.send(encodedData, 0, encodedData.length, info.port, info.address);
        });
    }
    async sendText(info, userId, packageName, roomId, text, timeout = 60000) {
        return this.sendEvent(info, 'send_text', { userId, packageName, roomId, text }, timeout);
    }
    async markAsRead(info, userId, packageName, roomId, timeout = 60000) {
        return this.sendEvent(info, 'read', { userId, packageName, roomId }, timeout);
    }
    async getProfileImage(info, userId, packageName, userHash) {
        return this.sendEvent(info, 'get_profile_image', {
            userId,
            packageName,
            userHash,
        });
    }
    async getRoomIcon(info, userId, packageName, roomId) {
        return this.sendEvent(info, 'get_room_icon', {
            userId,
            packageName,
            roomId,
        });
    }
}
exports.UDPServer = UDPServer;
