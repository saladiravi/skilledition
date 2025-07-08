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
    video_metadata,
  } = req.body;



  const videos = JSON.parse(video_metadata);

  const client = await pool.connect();

  const courseImage = req.files?.course_image?.[0]?.filename
    ? `uploads/${req.files.course_image[0].filename}` : null


  try {
    await client.query('BEGIN');


    const courseResult = await client.query(
      `INSERT INTO tbl_course (course_image, course_type, course_title, course_description, course_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING course_id`,
      [
        courseImage,
        course_type,
        course_title,
        course_description,
        course_price,
      ]
    );

    const course_id = courseResult.rows[0].course_id;

    for (let i = 0; i < videos.length; i++) {
      const { title, description } = videos[i];
      const video_file = req.files.course_video[i];

      const videoPath = path.join(__dirname, '../uploads', video_file.filename);
      const durationInSeconds = Math.round(await getVideoDurationInSeconds(videoPath));
      const duration = formatDuration(durationInSeconds); // "mm:ss" format string


      await client.query(
        `INSERT INTO tbl_course_videos (course_video_title, course_video, course_video_description, course_id,duration)
         VALUES ($1, $2, $3, $4, $5)`,
        [title, video_file.filename, description, course_id, duration]
      ); 
    }

    await client.query('COMMIT');
    res.status(200).json({
      statusCode: 200,
      message: 'Course and videos added'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  } finally {
    client.release();
  }
};


exports.getCourses = async (req, res) => {
  try {
    const query = `SELECT tc.course_image ,tc.course_title,
         tc.course_type,
         tc.course_description,
         tc.course_price,
         tvc.course_video_title, 
         tvc.course_video,
         tvc.course_video_description
             FROM tbl_course tc 
             INNER JOIN tbl_course_videos tvc 
             ON tc.course_id=tvc.course_id`;
    const coursedetails = await pool.query(query);
    res.json(coursedetails.rows);

  } catch (error) {
    console.error(error)
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error'
    })
  }
}

exports.updateCourseWithVideos = async (req, res) => {
  const {
    course_id,
    course_type,
    course_title,
    course_description,
    course_price,
    video_metadata,
  } = req.body;

  if (!course_id) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Course_id is Required'
    })
  }
  let videos = [];
  try {
    videos = JSON.parse(video_metadata);
  } catch (err) {
    return res.status(400).json({ status: 'error', message: 'Invalid video metadata JSON' });
  }

  const client = await pool.connect();
  const courseImage = req.files?.course_image?.[0]?.filename
    ? `uploads/${req.files.course_image[0].filename}`
    : null;

  try {
    await client.query('BEGIN');

    // 1. Update course details
    await client.query(
      `UPDATE tbl_course 
       SET course_type = $1, 
           course_title = $2, 
           course_description = $3, 
           course_price = $4, 
           course_image = COALESCE($5, course_image)
       WHERE course_id = $6`,
      [
        course_type,
        course_title,
        course_description,
        course_price,
        courseImage,
        course_id,
      ]
    );

    // 2. Delete old videos (optional - if replacing all videos)
    await client.query(`DELETE FROM tbl_course_videos WHERE course_id = $1`, [course_id]);

    // 3. Insert new videos
    for (let i = 0; i < videos.length; i++) {
      const { title, description } = videos[i];
      const video_file = req.files.course_video[i];

      await client.query(
        `INSERT INTO tbl_course_videos 
         (course_video_title, course_video, course_video_description, course_id)
         VALUES ($1, $2, $3, $4)`,
        [title, video_file.filename, description, course_id]
      );
    }

    await client.query('COMMIT');
    res.status(200).json({
      statusCode: 200,
      message: 'Course and videos updated successfully',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
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
      message: 'Course and related videos deleted successfully',
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
