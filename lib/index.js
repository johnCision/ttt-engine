import { UI } from './ui.js';
import { Service } from './service.js';
import { AI, STRATEGIES } from './ai.js';
//
const query = new URLSearchParams(window.location.search);
const hint = query.get('hint') ?? 'self';
const noServ = query.has('noserv');
//
const client = UI.from(new BroadcastChannel('TTT'), { user: hint });
//
if (!noServ) {
    document.body.toggleAttribute('data-green', true);
    Service.from(new BroadcastChannel('TTT'));
    AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.RANDOM, user: 'AI:random' });
    AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.MINMAX, user: 'AI:minmax' });
    AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.THREAT, user: 'AI:threat' });
    AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.ALPHABETA, user: 'AI:alphabeta' });
}
//
client.onContentLoad();
//
// clientPort.postMessage({ user: client.user, type: 'list-games' })
//# sourceMappingURL=index.js.map