const express = require("express");
const q2m = require("query-to-mongo");
const {
  authenticate,
  refreshToken,
  addToFavourites,
} = require("../../../auth/tools");
const { authorize } = require("../../../auth/middleware");

const UserModel = require("./schema");

const usersRouter = express.Router();

usersRouter.get("/", authorize, async (req, res, next) => {
  try {
    console.log(req.user);
    const users = await UserModel.find();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/me", authorize, async (req, res, next) => {
  try {
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/register", async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body);
    console.log("null? ->",newUser._id)
    const { _id } = await newUser.save();
    console.log(_id);
    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

usersRouter.put("/me", authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send(req.user);
  } catch (error) {
    next(error);
  }
});

usersRouter.delete("/me", authorize, async (req, res, next) => {
  try {
    await req.user.deleteOne(res.send("Deleted"));
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findByCredentials(email, password,{new:true});
    console.log(user)
    const tokens = await authenticate(user);
    console.log("a user has logged in");
    res.send(tokens.refreshTokens[tokens.refreshTokens.length-1]);
  } catch (error) {
    next(error);
  }
});

usersRouter.post("/logout", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = req.user.refreshTokens.filter(
      (t) => t.token !== req.body.refreshToken
    );
    await req.user.save();
    res.send();
  } catch (err) {
    next(err);
  }
});
//wtf
usersRouter.post("/logoutAll", authorize, async (req, res, next) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/refreshToken", async (req, res, next) => {
  const oldRefreshToken = req.body.refreshToken;
  if (!oldRefreshToken) {
    const err = new Error("Refresh token missing");
    err.httpStatusCode = 400;
    next(err);
  } else {
    try {
      const newTokens = await refreshToken(oldRefreshToken);
      res.send(newTokens);
    } catch (error) {
      console.log(error);
      const err = new Error(error);
      err.httpStatusCode = 403;
      next(err);
    }
  }
});

module.exports = usersRouter;

