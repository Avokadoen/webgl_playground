import { Observable, fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

interface EventHandle {
    keyEvent: Observable<KeyboardEvent>
    unsubscriber: Subject<string>
}

// TODO: this abstraction suck, do something completely different with input
//         also: memory leaks?
export namespace InputDelegater {
    const keyDownHandle = {
        keyEvent: fromEvent<KeyboardEvent>(document, 'keydown'),
        unsubscriber: new Subject<string>()
    }

    const keyPressedHandle = {
        keyEvent: fromEvent<KeyboardEvent>(document, 'keypress'),
        unsubscriber: new Subject<string>()
    }
    
    
    const keyUpHandle = {
        keyEvent: fromEvent<KeyboardEvent>(document, 'keyup'),
        unsubscriber: new Subject<string>()
    }

 

    const mouseEvent = fromEvent<MouseEvent>(window, 'mousemove');

    export function registerKeyDown(key: string): Observable<KeyboardEvent | null> {
        return registerKey(key, keyDownHandle);
    }

    export function registerKeyPressed(key: string): Observable<KeyboardEvent | null> {
        return registerKey(key, keyPressedHandle);
    }

    export function registerKeyUp(key: string): Observable<KeyboardEvent | null> {
       return registerKey(key, keyUpHandle);
    }

    export function registerMouse(): Observable<MouseEvent> {
        return mouseEvent;
    }

    export function setPointerLock(canvas: HTMLCanvasElement): boolean {
        const havePointerLock = 'pointerLockElement' in document 
        || 'mozPointerLockElement' in document 
        || 'webkitPointerLockElement' in document;
    
        if (!havePointerLock) {
            return false;
        }

        canvas.onclick = function() {
            canvas.requestPointerLock();
        }
        return true;
    }

    function registerKey(key: string, handle: EventHandle): Observable<KeyboardEvent | null> {
        const end = handle.unsubscriber.pipe(
            filter(k => k === key)
        );

        // unsubscribe previous keybinding
        handle.unsubscriber.next(key);

        return handle.keyEvent.pipe(
            takeUntil(end),
            filter((e: KeyboardEvent) => e.key === key)
        );
    }


}