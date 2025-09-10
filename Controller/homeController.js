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

    const query = `
      SELECT 
          cv.course_video_id,
          cv.course_video_title,
          cv.course_video,
          cv.duration
      FROM tbl_course_videos cv
      WHERE cv.course_id = $1
      ORDER BY cv.course_video_id;
    `;

    const result = await pool.query(query, [course_id]);

    res.json({
      statusCode: 200,
      message: "Course videos fetched successfully",
      result: result.rows
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