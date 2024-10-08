import type { AddressInfo } from 'net';
import type { UDPServer } from './server';
export declare class Message {
    #private;
    address: AddressInfo;
    room: {
        name: string;
        id: string;
        isGroupChat: boolean;
        icon: Promise<string>;
    };
    id: string;
    sender: {
        name: string;
        hash: string;
        profileImage: Promise<string>;
    };
    content: string;
    containsMention: boolean;
    time: number;
    app: {
        packageName: string;
        userId: number;
    };
    constructor(server: UDPServer, info: AddressInfo, data: {
        room: {
            name: string;
            id: string;
            isGroupChat: boolean;
        };
        id: string;
        sender: {
            name: string;
            hash: string;
        };
        content: string;
        containsMention: boolean;
        time: number;
        app: {
            packageName: string;
            userId: number;
        };
    });
    replyText(text: string, timeout?: number): Promise<boolean>;
    markAsRead(timeout?: number): Promise<boolean>;
}
