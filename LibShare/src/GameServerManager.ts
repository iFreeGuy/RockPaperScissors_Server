import {WSServerInfo} from './Common'

class GameServerManager
{
    async init() : Promise<boolean>
    {
        // For future use
        return true;
    }

    // In the future, provide one of the available servers with load balancing in mind.
    getAvailableGameServerInfo() : WSServerInfo | null
    {
        let info : WSServerInfo = {
            ip : '127.0.0.1',
            port : 4501
        };

        return info;
    }
}

let gameServerManager : GameServerManager = new GameServerManager();

export {gameServerManager}

