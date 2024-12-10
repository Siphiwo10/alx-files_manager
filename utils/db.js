import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${host}:${port}`, { useUnifiedTopology: true });

    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
      });
  }

  // Check if the client is connected
  isAlive() {
    return this.client.topology && this.client.topology.isConnected();
  }

  // Return the number of users in the database
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  // Return the number of files in the database
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

// Initialize and export DBClient instance
const dbClient = new DBClient();
export default dbClient;

