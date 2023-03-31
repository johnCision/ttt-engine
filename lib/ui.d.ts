import { User } from "./ttt.types";
export type UIOptions = {
    user: User;
};
export declare class UI {
    #private;
    static from(port: MessagePort | BroadcastChannel, options: UIOptions): UI;
    constructor(port: MessagePort | BroadcastChannel, options: UIOptions);
    onContentLoad(): void;
}
//# sourceMappingURL=ui.d.ts.map