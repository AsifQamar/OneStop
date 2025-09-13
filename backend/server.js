
require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`OneStop server is running on port ${PORT}`);
  console.log(`Access it at http://localhost:${PORT}`);
});