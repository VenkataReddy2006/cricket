const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Flutter UUID
  userEmail: { type: String, required: true },
  team1Name: { type: String, required: true },
  team2Name: { type: String, required: true },
  date: { type: Date, default: Date.now },
  result: { type: String, default: 'In Progress' },
  isCompleted: { type: Boolean, default: false },
  overs: { type: Number, required: true },
  team1Score: { type: Number, default: 0 },
  team1Wickets: { type: Number, default: 0 },
  team1Overs: { type: Number, default: 0 },
  team2Score: { type: Number, default: 0 },
  team2Wickets: { type: Number, default: 0 },
  team2Overs: { type: Number, default: 0 },
  matchData: { type: Object }
});

module.exports = mongoose.model('Match', matchSchema);
