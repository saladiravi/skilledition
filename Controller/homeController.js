const pool=require('../db/db');


 
exports.getCoursesWithCount = async (req, res) => {
  try {
   const query = `
  SELECT 
      c.course_id,
      c.course_title,
      c.course_type,
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
    const { course_id } = req.params;

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
