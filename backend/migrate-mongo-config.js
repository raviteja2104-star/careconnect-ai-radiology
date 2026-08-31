/**
 * migrate-mongo configuration for CareConnect.
 *
 * Reads MONGODB_URI from backend/.env (dotenv), falling back to the local
 * docker-compose replica set. The database name is taken from the URI path.
 *
 * Note on driver options: this project uses the MongoDB Node driver v6.x
 * (peer dependency of migrate-mongo v14). `useNewUrlParser` and
 * `useUnifiedTopology` were removed in driver v4+ and are no-ops / warnings
 * in v6, so they are intentionally NOT set here.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const DEFAULT_LOCAL_URI = 'mongodb://localhost:27017/careconnect?directConnection=true';

const config = {
    mongodb: {
        url: process.env.MONGODB_URI || DEFAULT_LOCAL_URI,
        options: {
            // Fail fast when the cluster is unreachable instead of hanging
            // for the driver's default 30s.
            serverSelectionTimeoutMS: 10000,
        },
    },

    // Migration files live in backend/migrations, named
    // <timestamp>-<description>.js (npx migrate-mongo create <name>).
    migrationsDir: 'migrations',

    // Collection where applied migrations are recorded.
    changelogCollectionName: 'changelog',

    // The file extension to create migrations with.
    migrationFileExtension: '.js',

    // Do not re-run a migration when its file content changes; the changelog
    // entry (by filename) is the source of truth.
    useFileHash: false,

    // This repo is CommonJS.
    moduleSystem: 'commonjs',
};

module.exports = config;
