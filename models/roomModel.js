const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['public', 'private'],
    required: true,
  }
});

roomSchema.index({ name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);