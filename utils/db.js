import { MongoClient } from 'mongodb';

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '27017';
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}`;

        this.client = new MongoClient(url, { useUnifiedTopology: true });
        this.databaseName = database;

        // Initialize the connection
        this.client.connect().then(() => {
            this.db = this.client.db(this.databaseName);
            console.log('Connected to MongoDB');
        }).catch((err) => {
            console.error('Failed to connect to MongoDB', err);
        });
    }

    isAlive() {
        return this.client.isConnected && this.client.isConnected();
    }

    async nbUsers() {
        try {
            const collection = this.db.collection('users');
            return await collection.countDocuments();
        } catch (err) {
            console.error('Error fetching users count', err);
            return 0;
        }
    }

    async nbFiles() {
        try {
            const collection = this.db.collection('files');
            return await collection.countDocuments();
        } catch (err) {
            console.error('Error fetching files count', err);
            return 0;
        }
    }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;

