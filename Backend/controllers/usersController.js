const Users = require('../models/Users');
const Task = require('../models/Task');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await Users.find().select('-password').lean();
    if(!users?.length){
        return res.status(400).json({message: 'No User found'})
    }
    res.json(users);
})

// @desc Create a users
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const {username, password, roles} = req.body;

    // Confirm Data
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({message: 'All fields are required'})
    }

    // check for duplicate
    const duplicate = await Users.findOne({username}).lean().exec();

    if(duplicate) {
        return res.status(409).json({message: 'Duplicate username'});
    }

    // hash password
    const hasedPwd = await bcrypt.hash(password, 10); 

    const userObject = {username, "password": hasedPwd, roles};

    // create and store new user
    const user = await Users.create(userObject);

    if(user){
        res.status(201).json({message: `New user ${user.username} created`});
    } else {
        res.status(400).json({message: 'Invalid user data received'});
    }
})

// @desc Update a users
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
    const {_id, username, roles, active, password} = req.body;

    // confirm data
    if(!_id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({message: 'All fields are required'});
    }

    const user = await Users.findById(_id).exec();

    if (!user) {
        return res.status(400).json({message: 'User not found'});
    }

    // check for duplicate
    const duplicate = await Users.findOne({username}).lean().exec();

    if (duplicate && duplicate?._id.toString() !== _id) {
        return res.status(409).json({message: 'Duplicate username'});
    }

    user.username = username;
    user.roles = roles;
    user.active = active;

    if(password){
        // hash password
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.json({message: `${updatedUser.username} updated`});
})

// @desc Delete a users
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const {_id} = req.body;

    if(!_id){
        return res.status(400).json({message: 'User ID is required'})
    }

    const task = await Task.findOne({user: _id}).lean().exec();
    if(task?.length){
        return res.json({message: 'User has assigned task'});
    }

    const user = await Users.findById(_id).exec();

    if(!user){
        return res.json({message: 'User not found'});
    }

    const result = await user.deleteOne();

    const reply = `Username ${result.username} with ID ${result._id} deleted successfully`;

    res.json(reply);

})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}


