import { Subject } from 'rxjs';

export enum DidRegisterInput {
    KeyTaken,
    Success
}

export class InputHandler {
    private keySubject: Subject<string>;
    private keyMap: Map<string, boolean>;

    constructor() {
        this.keySubject = new Subject<string>();
        this.keyMap = new Map<string, boolean>();
    }

    public registerInput(key: string): DidRegisterInput {
        if (!this.keyMap.has(key)) {
            return DidRegisterInput.KeyTaken;
        }

        this.keyMap.set(key, true);
    }

    public removeRegistered(key: string) {
        this.keyMap.delete(key);
    }
}