const pool = require('../db/db');
const bcrypt = require('bcryptjs');


exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      statusCode: 400,
      message: 'Email and Password are required'
    });
  }

  try {
    // Try logging in as admin
    const adminResult = await pool.query('SELECT * FROM admin WHERE email = $1', [email]);
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({
          statusCode: 401,
          message: 'Invalid credentials'
        });
      }
      return res.status(200).json({
        statusCode: 200,
        message: 'Admin login successful',
        role: 'admin',
        user: {
          admin_id: admin.admin_id,
          email: admin.email,
          role_type: admin.role_type
        }
      });
    }

    // Try logging in as tutor
    const tutorResult = await pool.query('SELECT * FROM tbl_tutor WHERE email = $1', [email]);
    if (tutorResult.rows.length > 0) {
      const tutor = tutorResult.rows[0];
      const isMatch = await bcrypt.compare(password, tutor.password);
      if (!isMatch) {
        return res.status(401).json({
          statusCode: 401,
          message: 'Invalid credentials'
        });
      }
      return res.status(200).json({
        statusCode: 200,
        message: 'Tutor login successful',
        role: 'tutor',
        user: {
          tutor_id: tutor.tutor_id,
          email: tutor.email,
          name: tutor.name,
          role_type:tutor.role_type
          // add more fields if needed
        }
      });
    }

    // If neither found
    return res.status(404).json({
      statusCode: 404,
      message: 'Not found'
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      statusCode: 500,
      message: 'Internal server error'
    });
  }
};
