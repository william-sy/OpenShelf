import dotenv from 'dotenv';

// Imported as the first thing by config/database.js (the earliest common
// dependency of nearly every module in this app, including standalone
// scripts). ES module imports are always fully evaluated before the
// importing module's own body runs, so this guarantees .env is loaded
// before anything reads process.env - regardless of which entry point
// (server.js, a script under src/scripts, etc.) started the process.
dotenv.config();
