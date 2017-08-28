
var mongodb = require('mongodb');

exports.up = function(db, next){
  var pets = db.Collection('results');
  next();
};

exports.down = function(db, next){
    next();
};
