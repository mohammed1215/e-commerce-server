import jwt from "jsonwebtoken"
import bcrypt from 'bcryptjs'
import User from "../models/user.model.js";
import { logger } from "../index.js";
import cloudinary from 'cloudinary'
import { Readable } from 'stream'
import { validationResult } from "express-validator";
import { } from 'express-validator'
import nodemailer from 'nodemailer'
import os from 'os'

const transporter = nodemailer.createTransport({
  host: `smtp.gmail.com`,
  port: 587,
  secure: false,
  auth: {
    user: process.env.TRANSPORTER_EMAIL,
    pass: process.env.TRANSPORTER_PASS,
  },
});
/**
 * 
 * @param {String} token 
 * @param {String} receiver 
 * @returns {Promise<import('nodemailer/lib/smtp-transport').SentMessageInfo>}
 */
function transporting(token, receiver) {
  const data = os.networkInterfaces()["Wi-Fi"].find(obj => obj.family === "IPv4");
  const link = process.env.SERVER_URL ?? data.address
  return new Promise((resolve, reject) => {
    transporter.sendMail({
      from: 'mohammedelbanawey264@gmail.com',
      to: receiver,
      subject: "Verify Your Email",
      html: `
      <h2>Verfy Your Email</h2>
        <p>to verify the email press <a href="http://${link}:5000/auth/verify?token=${token}">here</a></p>
        `,
    }, (err, info) => {
      if (err) {
        console.error('Email error:', err);
        return reject(err)
      }

      return resolve(info)
    })
  })
}

export const register = async (req, res, next) => {
  const { fullname, email, password, role } = req.body;
  try {

    const result = validationResult(req);

    if (!result.isEmpty()) {
      const errors = result.mapped()
      console.log(req.file)
      if (!req.file) {
        errors.image = { type: 'field', value: "", msg: "Field Must Upload Avatar Image", path: "fullname", location: "body" }
      }
      return res.status(400).json({ errors })
    }



    const user = await User.findOne({ email })
    if (user) {
      return res.status(409).json({ email: { type: 'field', value: "", msg: "Email Already Exists", path: "email", location: "body" } })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const stream = cloudinary.v2.uploader.upload_stream({
      folder: 'avatars',
      resource_type: "image"
    }, async (err, result) => {

      if (err) {
        return res.status(500).json({ message: "error happened while uploading image" })
      }

      const newUser = await User.create({
        fullname,
        email,
        password: hashedPassword,
        role,
        imgPath: result.secure_url,
        isVerified: false
      })

      const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '3d' })
      transporting(token, newUser.email).then(response => {
        return res.status(201).json({ status: 'success', message: "Verify your email" })
      }).catch(err => {
        console.log(err.stack)
        return res.status(500).json({ status: 'fail', message: 'Failed to send verification email' });
      })


    })

    Readable.from(req.file.buffer).pipe(stream)

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: error.message })
  }
}

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 * @returns 
 */
export const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({
        errors: {
          email: "User Not Found , try Signing Up"
        }
      })
    }

    const result = await bcrypt.compare(password, user.password)

    if (!result) {
      return res.status(400).json({
        errors: {
          password: "Password is incorrect"
        }
      })
    }


    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' })
    if (!user.isVerified) {
      return transporting(token, user.email).then(response => res.json({ message: "Your email is unverified, check your email" }))
    }
    res.cookie('token', token, {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      secure: true,
      httpOnly: true,
      sameSite: "none"
    })
    return res.status(201).json({ status: 'success', user, token })

  } catch (error) {
    console.log(error.message)
  }
}

/**
 * 
 * @param {*} req 
 * @param {import("express").Response} res 
 * @param {*} next 
 */

export const logout = async (req, res, next) => {
  try {

    res.clearCookie('token', {
      maxAge: 3 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    }).json({ message: "cookie has been removed" })

  } catch (error) {
    console.log(error.stack)
    return res.sendStatus(500)
  }
}

/**
 * 
 * @param {import("express").Request} req 
 * @param {*} res 
 * @returns 
 */
export const authMe = async (req, res) => {
  try {
    const token = req.cookies.token
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded._id, { password: false })
      return res.json({ user })
    }
    return res.status(404).json({ message: "token not found" })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "token is invalid" })
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "token is expired" })
    } else {
      logger.error(error.message)
      return res.sendStatus(500)
    }
  }
}
/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @returns 
 */
export const updateUserData = async (req, res) => {
  try {
    const { fullname } = req.body;
    const userId = req.user;
    const avatar = req.file

    console.log(req.file)

    const oldUser = await User.findById(userId)

    const stream = cloudinary.v2.uploader.upload_stream({
      folder: 'avatar',
      resource_type: "image"
    }, async (err, result) => {
      // result.secure_url
      if (err) {
        return res.status(500).json({ message: "error uploading image" })
      }
      oldUser.fullname = fullname ?? oldUser.fullname;
      oldUser.imgPath = result.secure_url;
      await oldUser.save()
      return res.status(200).json({ message: "updated successfully" })
    })
    if (!avatar) {
      oldUser.fullname = fullname ?? oldUser.fullname;
      await oldUser.save();
      return res.json({ message: "updated successfully" })
    }

    Readable.from(avatar.buffer).pipe(stream)


  } catch (error) {
    console.log(error.stack);
    return res.status(500).json({ message: "error" })
  }
}

export const verifyEmail = async (req, res) => {
  try {
    const token = req.query.token;
    console.log(token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded._id)
    if (user.isVerified) {
      return res.send(`<h1 style="color:gray;text-align:center;">Your Account is Already Verified</h1>`)
    }
    user.isVerified = true;
    await user.save()
    return res.send(`<h1 style="color:green;text-align:center;">Account Has Been Verified Successfully</h1>`)
  } catch (error) {
    return res.status(500).json({ error })
  }
}