require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

async function dropIndexes() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');
    try {
        await mongoose.connection.collection('radiologyscans').dropIndexes();
        console.log('Indexes dropped');
    } catch(e) {
        console.log('No indexes to drop or collection does not exist');
    }
    await mongoose.disconnect();
    process.exit(0);
}
dropIndexes().catch(e => { console.error(e); process.exit(1); });
