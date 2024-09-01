import { createClient } from 'redis';

class RedisClient {
    constructor(){
        const client = async () => await createClient();
        client.on('error', (error)=>{
            console.log(error)
        })
    }
}