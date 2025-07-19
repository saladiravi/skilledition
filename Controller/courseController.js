const pool = require('../db/db');
const { getVideoDurationInSeconds } = require('get-video-duration');


const path = require('path');


function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

exports.addCourseWithVideos = async (req, res) => {
  const {
    course_type,
    course_title,
    course_description,
    course_price,
    tutor_id,
    course_video_title
  } = req.body;

  const videos = JSON.parse(course_video_title);
  const client = await pool.connect();

  try {
    console.log('Files:', req.files);

    const courseImage = req.files?.course_image?.[0]?.filename 
      ? `uploads/${req.files.course_image[0].filename}` 
      : null;

    if (!courseImage) {
      return res.status(400).json({ message: "Course image is required" });
    }

    await client.query('BEGIN');

    const courseResult = await client.query(
      `INSERT INTO tbl_course 
        (course_image, course_type, course_title, course_description, course_price, tutor_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING course_id`,
      [courseImage, course_type, course_title, course_description, course_price, tutor_id]
    );

    const course_id = courseResult.rows[0].course_id;

    if (!req.files?.course_video || req.files.course_video.length !== videos.length) {
      throw new Error(`Uploaded videos count mismatch: expected ${videos.length}, got ${req.files?.course_video?.length || 0}`);
    }

    for (let i = 0; i < videos.length; i++) {
      const { title } = videos[i];
      const video_file = req.files.course_video[i];

      const videoPath = path.join(__dirname, '../uploads', video_file.filename);
      const durationInSeconds = Math.round(await getVideoDurationInSeconds(videoPath));
      const duration = formatDuration(durationInSeconds);

      await client.query(
        `INSERT INTO tbl_course_videos (course_video_title, course_video, course_id, duration)
         VALUES ($1, $2, $3, $4)`,
        [title, video_file.filename, course_id, duration]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ 
      statusCode:200,
      message: 'Course Added Sucessully'
     });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ 
      statusCode:500,
      message: err.message || 'Internal Server Error' });
  } finally {
    client.release();
  }
};






exports.getCourses = async (req, res) => {
  try {
    const query = `
      SELECT 
        tc.course_id,
        tc.course_image,
        tc.course_title,
        tc.course_type,
        tc.course_description,
        tc.course_price,
        tc.tutor_id,
        t.name AS tutor_name,
        tvc.course_video_title,
        tvc.course_video,
        tvc.duration
      FROM tbl_course tc
      INNER JOIN tbl_course_videos tvc ON tc.course_id = tvc.course_id
      LEFT JOIN tbl_tutor t ON tc.tutor_id = t.tutor_id
      ORDER BY tc.course_id;
    `;

    const result = await pool.query(query);

    // Group by course
    const coursesMap = {};

    for (let row of result.rows) {
      if (!coursesMap[row.course_id]) {
        coursesMap[row.course_id] = {
          course_id: row.course_id,
          course_image: row.course_image,
          course_title: row.course_title,
          course_type: row.course_type,
          course_description: row.course_description,
          course_price: row.course_price,
          tutor: {
            tutor_id: row.tutor_id,
            tutor_name: row.tutor_name
          },
          videos: []
        };
      }
      coursesMap[row.course_id].videos.push({
        course_video_title: row.course_video_title,
        course_video: row.course_video,
        duration: row.duration
      });
    }

    const courses = Object.values(coursesMap);

    res.json({
      statusCode:200,
      message:'Course Fetched Sucessfully',
      course :courses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error'
    });
  }
};



exports.updateCourseWithVideos = async (req, res) => {
  const {
    course_id,
    course_type,
    course_title,
    course_description,
    course_price,
    tutor_id,
    course_video_title,
  } = req.body;

  if (!course_id) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Course_id is required'
    });
  }

  let videos = [];
  try {
    videos = JSON.parse(course_video_title);
  } catch (err) {
    console.error("JSON parse error:", err);
    return res.status(400).json({
      status: 'error',
      message: 'Invalid video metadata JSON'
    });
  }

  let courseImage = null;
  if (req.files?.course_image && Array.isArray(req.files.course_image) && req.files.course_image.length > 0) {
    courseImage = `uploads/${req.files.course_image[0].filename}`;
  } else if (req.file) {
    courseImage = `uploads/${req.file.filename}`;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE tbl_course 
       SET course_type = $1, 
           course_title = $2, 
           course_description = $3, 
           course_price = $4, 
           tutor_id = $5,
           course_image = COALESCE($6, course_image)
       WHERE course_id = $7`,
      [
        course_type,
        course_title,
        course_description,
        course_price,
        tutor_id,
        courseImage,
        course_id
      ]
    );

    await client.query(`DELETE FROM tbl_course_videos WHERE course_id = $1`, [course_id]);

    if (!req.files?.course_video || req.files.course_video.length !== videos.length) {
      throw new Error(`Uploaded videos count mismatch: expected ${videos.length}, got ${req.files?.course_video?.length || 0}`);
    }

    for (let i = 0; i < videos.length; i++) {
      const { title } = videos[i];
      const video_file = req.files.course_video[i];

      const videoPath = path.join(__dirname, '../uploads', video_file.filename);
      const durationInSeconds = Math.round(await getVideoDurationInSeconds(videoPath));
      const duration = formatDuration(durationInSeconds);

      await client.query(
        `INSERT INTO tbl_course_videos 
         (course_video_title, course_video, course_id, duration)
         VALUES ($1, $2, $3, $4)`,
        [title, video_file.filename, course_id, duration]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({
      statusCode: 200,
      message: 'Courses updated successfully'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({
      statusCode:500,
       
      message: err.message || 'Internal Server Error'
    });
  } finally {
    client.release();
  }
};





exports.deleteCourse = async (req, res) => {
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({
      statusCode: 400,
      message: 'course_id is required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Step 1: Delete related videos
    await client.query(
      'DELETE FROM tbl_course_videos WHERE course_id = $1',
      [course_id]
    );

    // Step 2: Delete the course
    const result = await client.query(
      'DELETE FROM tbl_course WHERE course_id = $1 RETURNING *',
      [course_id]
    );

    await client.query('COMMIT');

    if (result.rowCount === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      statusCode: 200,
      message: 'Courses deleted successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
    });
  } finally {
    client.release();
  }
};


exports.getCourseById = async (req, res) => {
  try {
    const { course_id } = req.body;

    const query = `
      SELECT 
        tc.course_id,
        tc.course_image,
        tc.course_title,
        tc.course_type,
        tc.course_description,
        tc.course_price,
        tc.tutor_id,
        t.name AS tutor_name,
        tvc.course_video_title,
        tvc.course_video,
        tvc.duration
      FROM tbl_course tc
      INNER JOIN tbl_course_videos tvc ON tc.course_id = tvc.course_id
      LEFT JOIN tbl_tutor t ON tc.tutor_id = t.tutor_id
      WHERE tc.course_id = $1
      ORDER BY tvc.course_video_id;
    `;

    const result = await pool.query(query, [course_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        statusCode: 404,
        message: 'Course not found'
      });
    }

    const row = result.rows[0];

    const course = {
      course_id: row.course_id,
      course_image: row.course_image,
      course_title: row.course_title,
      course_type: row.course_type,
      course_description: row.course_description,
      course_price: row.course_price,
      tutor: {
        tutor_id: row.tutor_id,
        tutor_name: row.tutor_name
      },
      videos: result.rows.map(video => ({
        course_video_title: video.course_video_title,
        course_video: video.course_video,
        duration: video.duration
      }))
    };

    res.json({
      statusCode:200,
      message:'Courses Fetched Sucessfully',
      course: course
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error'
    });
  }
};
