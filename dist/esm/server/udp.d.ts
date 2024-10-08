import type TypedEmitter from 'typed-emitter';
import { type SocketType } from 'node:dgram';
import type { AddressInfo } from 'node:net';
import { Events, RKPlugin } from '..';
import { Config, Data } from '../types';
declare const UDPServer_base: new () => TypedEmitter<Events>;
export declare class UDPServer extends UDPServer_base {
    #private;
    serviceName?: string;
    constructor({ socketType, serviceName, }?: {
        socketType?: SocketType;
        serviceName?: string;
    });
    usePlugin<T extends new (server: UDPServer, config?: Config) => RKPlugin>(Plugin: T, pluginOptions?: ConstructorParameters<T>[1], enableLog?: boolean): RKPlugin;
    start(port?: number, address?: string, enableLog?: boolean): Promise<void>;
    sendEvent<T>(info: AddressInfo, event: string, data: Data, timeout?: number): Promise<T>;
    sendText(info: AddressInfo, userId: number, packageName: string, roomId: string, text: string, timeout?: number): Promise<boolean>;
    markAsRead(info: AddressInfo, userId: number, packageName: string, roomId: string, timeout?: number): Promise<boolean>;
    getProfileImage(info: AddressInfo, userId: number, packageName: string, userHash: string): Promise<string>;
    getRoomIcon(info: AddressInfo, userId: number, packageName: string, roomId: string): Promise<string>;
}
export {};
