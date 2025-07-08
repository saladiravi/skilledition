const express = require("express");
const path = require("path");  
const cors=require('cors');
const adminroutes=require('./routes/adminRoutes');
const studentRoutes=require('./routes/studentroutes');
const tutorRoutes=require('./routes/tutorroutes');
const courseRoutes=require('./routes/courseRoutes')
 
const studentCourseRoutes=require('./routes/studentcourseroutes');
const studentwatchedvideos=require('./routes/studentwatchedvideosroutes');


const app = express();


app.use(express.json());
app.use(cors());

app.use('/admin',adminroutes);
app.use('/student',studentRoutes);
app.use('/tutor',tutorRoutes);
app.use('/course',courseRoutes);
 
app.use('/studentcourse',studentCourseRoutes);
app.use('/addStudentWatch',studentwatchedvideos);




app.listen(5001, () => {
    console.log("Server is running on port 5001");
});
