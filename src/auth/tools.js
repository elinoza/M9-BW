const jwt = require("jsonwebtoken");
const User = require("../services/users/schema");
const mongoose = require("mongoose")
const authenticate = async (user) => {
  try {
    const newAccessToken = await generateJWT({ _id: user._id }); // why do we pass user id?
    const newRefreshToken = await generateRefreshJWT({ _id: user._id });
    const user2 = await User.findByIdAndUpdate(mongoose.Types.ObjectId(user._id),{$addToSet:{refreshTokens:{ token: newAccessToken, refreshToken:newRefreshToken }}},{new:true});
   console.log("user2->",user2)

    return user2;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const generateJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );
addToFavourites = async (id, city) => {
  try {
    const user = await User.findByIdAndUpdate(mongoose.Types.ObjectId(id),{$addToSet:{favourites:city}},{new:true});
    console.log(user)
    return user;
  } catch (err) {
    console.log("Problem with adding to favourites -> ", err);
  }
};
verifyJWT = (token) => {
  console.log("token to verify ", token);
  console.log("secret ->", process.env.JWT_SECRET);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("decoded");
  return decoded;
};

const generateRefreshJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const verifyRefreshToken = (token) =>
  new Promise((res, rej) =>
    jwt.verify(token, process.env.REFRESH_JWT_SECRET, (err, decoded) => {
      if (err) rej(err);
      res(decoded);
    })
  );

const refreshToken = async (oldRefreshToken) => {
  //Verify old refresh token and receive back user holding it
  const decoded = await verifyRefreshToken(oldRefreshToken);
  //Find a user with that token
  const user = await User.findOne({ _id: decoded._id });
  //if there is no such user witt that id throw new error
  if (!user) {
    throw new Error(`Access is forbidden`);
  }

  //This is a check method to see if the current refresh token is in the users tokens array
  const currentRefreshToken = user.refreshTokens.find(
    (t) => t.refreshToken === oldRefreshToken
  );
  //And if it is not then throw a new error `Refresh token is wrong`
  if (!currentRefreshToken) {
    throw new Error(`Refresh token is wrong`);
  }

  //If everything is aight on this stage then generate new Access & Refresh token
  const newAccessToken = await generateJWT({ _id: user._id });
  const newRefreshToken = await generateRefreshJWT({ _id: user._id });

  //We create an array without the old refresh token and add the new one as an object { token: newRefreshToken }
  const newRefreshTokens = user.refreshTokens
    .filter((t) => t.refreshToken !== oldRefreshToken)
    .concat({ refreshToken: newRefreshToken });
  //We set this array as the users refresh Tokens array
  user.refreshTokens = [...newRefreshTokens];
  //We save the user in DB
  await user.save();
  //We return back both the Access & Refresh tokens
  return { token: newAccessToken, refreshToken: newRefreshToken };
};

module.exports = { authenticate, verifyJWT, refreshToken, addToFavourites };
