const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  name: { type: String, required: true },
  imageBase64: { type: String, default: null },
  batting: {
    matches: { type: Number, default: 0 },
    innings: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    notOuts: { type: Number, default: 0 },
    bestScore: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    thirties: { type: Number, default: 0 },
    fifties: { type: Number, default: 0 },
    hundreds: { type: Number, default: 0 },
    ducks: { type: Number, default: 0 },
    goldenDucks: { type: Number, default: 0 }
  },
  bowling: {
    matches: { type: Number, default: 0 },
    innings: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    bestBowlingWickets: { type: Number, default: 0 },
    bestBowlingRuns: { type: Number, default: 0 },
    economy: { type: Number, default: 0 },
    strikeRate: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    dotBalls: { type: Number, default: 0 },
    threeWickets: { type: Number, default: 0 },
    fiveWickets: { type: Number, default: 0 },
    sevenWickets: { type: Number, default: 0 },
    tenWickets: { type: Number, default: 0 }
  },
  fielding: {
    matches: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 }
  },
  captaincy: {
    matches: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 }
  }
});

module.exports = mongoose.model('Player', playerSchema);
