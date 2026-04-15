const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => console.log("TU HASH ES:", hash));