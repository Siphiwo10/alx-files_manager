import Redis from 'ioredis';

class RedisClient {
    constructor() {
        // Create a new Redis client connection
        this.client = new Redis();

        // Handle Redis client error
        this.client.on('error', (err) => {
            console.error('Redis client error: ', err);
        });
    }

    // Check if Redis connection is alive
    isAlive() {
        try {
            // Attempt to ping Redis to check connection
            return this.client.ping().then(response => response === 'PONG');
        } catch (error) {
            console.error('Error checking Redis connection:', error);
            return false;
        }
    }

    // Asynchronous method to get a value from Redis by key
    async get(key) {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error('Error getting data from Redis:', error);
            return null;
        }
    }

    // Asynchronous method to set a key-value pair in Redis with expiration
    async set(key, value, duration) {
        try {
            await this.client.setex(key, duration, value);
        } catch (error) {
            console.error('Error setting data in Redis:', error);
        }
    }

    // Asynchronous method to delete a key from Redis
    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Error deleting data from Redis:', error);
        }
    }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
