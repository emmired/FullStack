const express = require("express");
const User = require("../models/User");
const router = express.Router();

//create a new user
router.post("/users", (req, res) => {
    const user = new User(req.body);
    user.save()
        .then(result => {
            res.status(201).send(result);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

//Get all users
router.get("/users", (req, res) => {
    User.find()
        .then(users => {
            console.log(users)
            res.status(200).send(users);
        })
        .catch(err => {
            res.status(500).send(err);
        });
});

module.exports = router