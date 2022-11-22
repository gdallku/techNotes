const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if(!users){
        return res.status(400).json({message :'No users found'})
    }
    res.json(users)
});

// @desc Create new user
// @route POST /users
// @access Private

const createNewUser = asyncHandler(async (req, res) => {
    const {username,password,roles}=req.body

    //Confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({message:'All fields are required'})
    }

    // Check dor duplicate
    const duplicate = await User.findOne({username}).lean().exec()

    if(duplicate){
        return res.status(409).json({message:'Duplicate username'})
    }
    //hash password

    const hashedPwd = await bcrypt.hash(password,10)

    const userObject = {username, "password":hashedPwd,roles}

    // Create and Store new user
    const user = await User.create(userObject)

    if(user){
        res.status(201).json({message:`New user ${username} created`})

    }else{
        res.status(400).json({message:'Invalid User data recived' })
    }
});

// @desc Uptade new user
// @route Patch /users
// @access Private

const updateUser = asyncHandler(async (req, res) => {
    const {id,username,roles,active,password}=req.body

    //confirm data

    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !=='boolean')
    {
        return res.status(400).json({message:'All field are required'})
    }
    const user = await User.findById(id).exec()

    if(!user){
        return res.status(400).json({message:'User not found'})
    }
    //check for duplicate
    const duplicate = await User.findOne({username}).lean().exec()

    //Allow update to the original user

    if(duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({message: 'Duplicate username'})
    }
    user.username=username
    user.roles=roles
    user.active=active

    if(password){
        // Hashed pass
        user.password=await bcrypt.hash(password,10)
    }
    const updateUser = await user.save()

    res.json({message:`${updateUser.username} updated`})
});

// @desc Delete new user
// @route Patch /users
// @access Private

const deleteUser = asyncHandler(async (req, res) => {
    const {id}=req.body

    if(!id){
        return res.status(400).json({message:'User ID required'})
    }

    const notes = await Note.findOne({user:id}).lean().exec()
    if(notes?.length){
        return res.status(400).josn({message:'User has assigned notes'})
    }

    const user = await User.findById(id).exec()
    if(!user){
        return res.status(400).json({message:'User not found'})
    }
    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} deleted`

});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
};
