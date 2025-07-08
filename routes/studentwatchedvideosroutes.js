const express=require('express');
const routes=express.Router();
const watchedvideos=require('../Controller/studentwatchedvideosController');

routes.post('/watchingvideos', watchedvideos.addStudentVideoProgress);
     
  
module.exports= routes