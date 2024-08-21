const express = require("express")
const router = express.Router()
const multer = require("multer")
const path = require("path")
const Post = require("../models/Post")
const User = require('../models/User')
const authenticate = require("../middleware/authenticate")

// Multer Configuration
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    )
  },
})

function checkFileType(file, cb) {
  const filetypes = /jpeg|jgp|png|gif/
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = filetypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb("Error: Images Only!")
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb)
  },
}).single("image")


// Create a Post
router.post("/create", authenticate, (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send({
        success: false,
        message: err,
      })
    }

    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No file uploaded",
      })
    }

    const { caption } = req.body
    const imageUrl = req.file.path // Path to the uploaded file

    try {
      const post = new Post({
        user: req.userId,
        caption,
        imageUrl,
      })
      await post.save()

      await User.findByIdAndUpdate(req.userId, { $push: { posts: post._id } })

      res.status(201).send({
        success: true,
        message: "Post created successfully",
        post,
      })
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.message,
      })
    }
  })
})

// Get all posts
// router.get('/posts', authenticate, async (req, res) => {
//   try {
//       const posts = await Post.find();
//       res.status(200).send({
//           success: true,
//           posts: posts,
//           request: {
//               query: req.query,
//               params: req.params,
//               headers: req.headers,
//               body: req.body
//           }
//       });
//   } catch (err) {
//       res.status(500).send({
//           success: false,
//           error: err.message,
//           request: {
//               query: req.query,
//               params: req.params,
//               headers: req.headers,
//               body: req.body
//           }
//       });
//   }
// });

// Like a post
router.post("/:id/like", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).send({ success: false, message: "Post not found" })
    }

    const userId = req.userId // Get the user ID from the authenticated user

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      // If the user has already liked the post, remove the like (unlike)
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      )
    } else {
      // If the user has not liked the post, add the like
      post.likes.push(userId)
    }

    await post.save()

    res
      .status(200)
      .send({ success: true, message: "Post liked/unliked successfully", post })
  } catch (err) {
    res.status(500).send({ success: false, message: err.message })
  }
})

// Unlike a Post
router.put("/:id/unlike", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).send({ success: false, message: "Post not found" })
    }
    const index = post.likes.indexOf(req.userId)
    if (index === -1) {
      return res
        .status(400)
        .send({ success: false, message: "Post not liked yet" })
    }
    post.likes.splice(index, 1)
    await post.save()
    res.status(200).send({ success: true, message: "Post unliked", post })
  } catch (err) {
    res.status(500).send({ success: false, message: err.message })
  }
})

// Add a Comment
router.post("/:id/comment", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).send({ success: false, message: "Post not found" })
    }

    const { comment } = req.body // Accessing the comment text from the request body

    if (!comment) {
      return res
        .status(400)
        .send({ success: false, message: "Comment text is required" })
    }

    const newComment = {
      user: req.userId, // Use req.userId set by the authenticate middleware
      text: comment, // Use the comment text from the form
      createdAt: new Date(),
    }

    post.comments.push(newComment)
    await post.save()

    res.redirect('/') 
  } catch (err) {
    res.status(500).send({ success: false, message: err.message })
  }
})

// Remove a Comment
router.delete("/comment/:id/:commentId", authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).send({ success: false, message: "Post not found" })
    }
    const comment = post.comments.id(req.params.commentId)
    if (!comment) {
      return res
        .status(404)
        .send({ success: false, message: "Comment not found" })
    }
    if (comment.user.toString() !== req.userId) {
      return res.status(401).send({ success: false, message: "Not authorized" })
    }
    comment.remove()
    await post.save()
    res.status(200).send({ success: true, message: "Comment removed", post })
  } catch (err) {
    res.status(500).send({ success: false, message: err.message })
  }
})

module.exports = router
