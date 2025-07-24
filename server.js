const express = require("express");
const path = require("path");  
const cors=require('cors');
const adminroutes=require('./routes/adminRoutes');
const studentRoutes=require('./routes/studentroutes');
const tutorRoutes=require('./routes/tutorroutes');
const courseRoutes=require('./routes/courseRoutes')
const examRoutes=require('./routes/examRoutes');
const studentCourseRoutes=require('./routes/studentcourseroutes');
const studentwatchedvideos=require('./routes/studentwatchedvideosroutes');
const login=require('./Controller/loginController');

const app = express();


app.use(express.json());
app.use(cors());

app.use('/admin',adminroutes);
app.use('/student',studentRoutes);
app.use('/tutor',tutorRoutes);
app.use('/course',courseRoutes);
app.use('/exam',examRoutes);
app.use('/studentcourse',studentCourseRoutes);
app.use('/addStudentWatch',studentwatchedvideos);
app.use('/loginapi',login);




const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

