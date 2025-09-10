const pool=require('../db/db');


 
exports.getCoursesWithCount = async (req, res) => {
  try {
   const query = `
  SELECT 
      c.course_id,
      c.course_title,
      c.course_type,
      c.course_image,
      COUNT(cv.course_video_id) AS total_lessons,
      COALESCE(
        ROUND(
          SUM(
            (SPLIT_PART(cv.duration, ':', 1)::INT * 60) + 
            (SPLIT_PART(cv.duration, ':', 2)::INT)
          ) / 3600.0,
          2
        ),
        0
      ) AS total_hours
  FROM tbl_course c
  LEFT JOIN tbl_course_videos cv ON c.course_id = cv.course_id
  GROUP BY c.course_id, c.course_title, c.course_type
  ORDER BY c.course_type, c.course_id;
`;


    const result = await pool.query(query);

    // Group by course_type
    const groupedData = {};
    result.rows.forEach(row => {
      if (!groupedData[row.course_type]) {
        groupedData[row.course_type] = [];
      }
      groupedData[row.course_type].push({
      
        course_id: row.course_id,
        course_image:row.course_image,
        course_title: row.course_title,
        total_hours: row.total_hours + " hours", // if you want hours string
        total_lessons: row.total_lessons + " lessons"
      });
    });

    res.json({
      statusCode: 200,
      message: "Courses fetched successfully",
      result: groupedData
    });

  } catch (error) {
    console.error("Error fetching courses with count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


 
exports.getCourseVideos = async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "course_id is required"
      });
    }

    const query = `
      SELECT 
          c.course_id,
          c.course_title,
          c.course_type,
          c.course_description,
          c.course_price,
          c.course_image,
          t.tutor_id,
          t.name AS tutor_name,
          cv.course_video_id,
          cv.course_video_title,
          cv.course_video,
          cv.duration,
          -- Calculate total duration in minutes
          SUM((SPLIT_PART(cv.duration, ':', 1)::INT * 60) + (SPLIT_PART(cv.duration, ':', 2)::INT)) 
            OVER (PARTITION BY c.course_id) AS total_duration_seconds
      FROM tbl_course_videos cv
      INNER JOIN tbl_course c ON cv.course_id = c.course_id
      LEFT JOIN tbl_tutor t ON c.tutor_id = t.tutor_id
      WHERE c.course_id = $1
      ORDER BY cv.course_video_id ASC;
    `;

    const result = await pool.query(query, [course_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "No videos found for this course"
      });
    }

    // Extract course details and tutor from first row
    const { course_title, course_type, course_description, course_price, course_image, tutor_id, tutor_name, total_duration_seconds } = result.rows[0];

    // Convert total duration to "hh:mm:ss" format
    const hours = Math.floor(total_duration_seconds / 3600);
    const minutes = Math.floor((total_duration_seconds % 3600) / 60);
    const seconds = total_duration_seconds % 60;
    const total_duration = `${hours}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;

    const videos = result.rows.map(row => ({
      course_video_id: row.course_video_id,
      course_video_title: row.course_video_title,
      course_video: row.course_video,
      duration: row.duration
    }));

    res.json({
      statusCode: 200,
      message: "Course videos fetched successfully",
      course: {
        course_id,
        course_title,
        course_type,
        course_description,
        course_price,
        course_image,
        tutor: {
          tutor_id,
          tutor_name
        },
        total_duration,
        videos
      }
    });

  } catch (error) {
    console.error("Error fetching course videos:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

 

exports.getCourseVideoById = async (req, res) => {
  try {
    const { course_video_id } = req.body;

    if (!course_video_id) {
      return res.status(400).json({
        statusCode: 400,
        message: "course_video_id is required"
      });
    }

    const query = `
      SELECT 
          course_video_id,
          course_video_title,
          course_video,
          duration,
          course_id
      FROM tbl_course_videos
      WHERE course_video_id = $1
      LIMIT 1;
    `;

    const result = await pool.query(query, [course_video_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: "Course video not found"
      });
    }

    res.json({
      statusCode: 200,
      message: "Course video details fetched successfully",
      result: result.rows[0]
    });

  } catch (error) {
    console.error("Error fetching course video by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};