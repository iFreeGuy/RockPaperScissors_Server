import {MongoClient, Db, MongoError} from 'mongodb';
import * as redis from 'redis';
import * as utils from './Utils'

export var mongoDB : Db;

async function MongoDBInit(connectionString : string, DBName : string): Promise<boolean>
{
    try
    {
        const client = await MongoClient.connect(connectionString);
        mongoDB = client.db(DBName);
        utils.logger.log('connected to mongodb');
    } catch(err) {
        utils.logger.error(`fail to connect to mongodb : ${(<Error>err).message}`);
        return false;
    }

    return true;
}

export var redisDB : Record<string, any>;

async function RedisInit()
{
    const redisClient = redis.createClient({legacyMode : true});

    redisClient.on('connect', () => {
        utils.logger.log('connected to redis');
    });

    redisClient.on('error', (err : any) => {
        utils.logger.error(`redis error : ${(<Error>err).message}`);
        return;
    });

    await redisClient.connect(); 
    redisDB = redisClient.v4;

    return true;
}

export async function DBInit(mongDBConnectionString : string, DBName : string) : Promise<boolean>
{
    if (!await MongoDBInit(mongDBConnectionString, DBName)) {
        return false;
    }

    if (!await RedisInit()) {
        return false;
    }

    return true;
}

