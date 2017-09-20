const express = require('express');
const Sequelize = require('sequelize');
const Events = require('../models/eventSchema');
const parser = require('body-parser');
const NodeGeocoder = require('node-geocoder');
const geodist = require('geodist');
const Participations = require('../models/usersEventsSchema.js');

exports.searchEvents = (req, res) => {

  let options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: 'AIzaSyAW-bhpsTQLkZsOn_3dVOyde1WwxrIUhqU'
  };
  let geocoder = NodeGeocoder(options);
  geocoder.geocode(req.body.address)
  .then(function(mapRes) {
    let guestLatitude = mapRes[0].latitude;
    let guestLongitude = mapRes[0].longitude;
    let date = req.body.date;
    let user_id = req.body.user_id
    let type = req.body.dinnerType;
    Events.findAll({
      where: {
        date: date,
        dinner_type: type
      }
    })
    .then( (events) => {
      if (events.length > 0) {
        let userCoordinates = {lat: guestLatitude, lon: guestLongitude}
        let closestEvent = events.reduce((closest, event) => {
          let closestCoords = closest.address;
          let eventCoords = event.address;
          let closestDist = geodist(userCoordinates, {lat: closestCoords[0], lon: closestCoords[1]})
          let eventDist = geodist(userCoordinates, {lat: eventCoords[0], lon: eventCoords[1]})
          return closestDist > eventDist ? event : closest;
        })
        Participations.create({
          user_id: user_id,
          event_id: closestEvent.id
        })
        .then(() => {
          res.send('success');
        })
        .catch((err) => {
          console.error(err)
        })
      } else {
        res.send('There were no events matching your search, but we encourage you to be the first!')
      }
    })
  })
  .catch(function(err) {
    console.log(err);
  });


};
