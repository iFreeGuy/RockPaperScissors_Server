import * as DB from './DB'
import {v4 as uuidv4} from 'uuid'


export enum sessionInfoKey
{
    id = "id",
    login = "login"
}

export class sessionInfo
{
    private id_ : string;
    private infos_ : Map<string, string>;

    constructor(id : string, jsonInfo? : string)
    {
        this.id_ = id;
        
        if (jsonInfo)
        {
            this.infos_ = new Map<string, string>(JSON.parse(jsonInfo));
        }
        else 
        {
            this.infos_ = new Map<string, string>();
        }
    }

    public ID() : string
    {
        return this.id_;
    }

    public infos() : Map<string, string>
    {
        return this.infos_;
    }

    public infos2Json() : string
    {
        var result = JSON.stringify(Array.from(this.infos_.entries()));
        
        return result;
    }

    public infosFromJson(json: string)
    {
        this.infos_ = new Map<string, string>(JSON.parse(json));
    }

    public async save()
    {
        let jsonInfos = this.infos2Json();
        await DB.redisDB.hSet('MGS_Sessions', this.id_, jsonInfos);
    }
}

export class sessionManager
{
    static sessionTimeout : number = 1000 * 60 * 60 * 12;

    static async getSessionKey(id: string) : Promise<string | null>
    {
        return await DB.redisDB.hGet('MGS_Logins', id);
    }

    static async getSessionInfo(sessionKey: string) : Promise<sessionInfo | null>
    {
        const lastUse = await sessionManager.lastUse(sessionKey);
        if (!lastUse)
        {
            return null;
        }

        let jsonInfos = await DB.redisDB.hGet('MGS_Sessions', sessionKey);

        if (jsonInfos)
        {
            let session =  new sessionInfo(sessionKey, jsonInfos);

            let elapsed = Date.now() - lastUse;
            if (sessionManager.sessionTimeout < elapsed)
            {
                let id = session.infos().get(sessionInfoKey.id)!
                sessionManager.remove(id, sessionKey);

                return null;
            }
    
            await sessionManager.setLastUse(sessionKey);

            return session;
        }
        else
        {
            return null;
        }
    }

    static async create(id : string) : Promise<sessionInfo>
    {
        let sessionKey = await sessionManager.getSessionKey(id);

        if (sessionKey != null)
        {
            sessionManager.remove(id, sessionKey);
        }

        sessionKey = uuidv4();
        let now = new Date();

        let session = new sessionInfo(sessionKey);
        session.infos().set(sessionInfoKey.id, id);
        session.infos().set(sessionInfoKey.login, now.toLocaleString());

        await DB.redisDB.hSet('MGS_Logins', id, sessionKey);
        await sessionManager.setLastUse(sessionKey);

        session.save();

        return session;
    }

    static async setLastUse(sessionKey: string)
    {
        await DB.redisDB.hSet('MGS_SessionLastUse', sessionKey, Date.now());
    }

    static async lastUse(sessionKey: string) : Promise<number>
    {
        return await DB.redisDB.hGet('MGS_SessionLastUse', sessionKey);
    }

    static async remove(id : string, sessionKey: string)
    {
        await DB.redisDB.hDel('MGS_SessionLastUse', sessionKey);
        await DB.redisDB.hDel('MGS_Logins', id);
        await DB.redisDB.hDel('MGS_Sessions', sessionKey);
    }
}


