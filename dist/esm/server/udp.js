import EventEmitter from 'node:events';
import { createSocket } from 'node:dgram';
import { randomUUID } from 'node:crypto';
import { Message } from '..';
import RKError from '../error';
import { readyLog, rkColor, rkLog } from '../logger';
export class UDPServer extends EventEmitter {
    #socket;
    #sessionEmitter;
    #plugins = [];
    serviceName;
    constructor({ socketType = 'udp4', serviceName, } = {}) {
        // rome-ignore lint/correctness/noInvalidConstructorSuper:
        super();
        this.#socket = createSocket(socketType);
        this.#sessionEmitter = new EventEmitter();
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
            rkLog(`Plugin ${rkColor(plugin.constructor.name)} enabled!`);
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
                    this.emit('message', new Message(this, remoteInfo, data));
                    break;
            }
        });
        await new Promise((res) => this.#socket.bind(port, address, () => res()));
        if (enableLog)
            readyLog(this.serviceName, port);
        this.emit('ready', port);
    }
    async sendEvent(info, event, data, timeout = 60000) {
        return new Promise((res) => {
            const session = randomUUID();
            const encodedData = encodeURIComponent(JSON.stringify({ event, session, data }));
            const t = setTimeout(() => {
                throw new RKError(RKError.TIMEOUT);
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
