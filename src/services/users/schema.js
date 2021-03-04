const { Schema, model } = require("mongoose")
const bcrypt = require("bcryptjs")

const UserSchema = new Schema(
	{
		googleId: String,
		password: {
			type: String,
			//	required: true,
		},
		email: {
			type: String,
			required: true,
		},
		userName: String,
		fullName: String,
		//name: String,
		//surname: String,
		profilePicUrl: String,
		posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
		comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
		likedPosts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
		likedComments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
		follows: [{ type: Schema.Types.ObjectId, ref: "user" }],
		refreshTokens: [
			{
				token: {
					type: String,
				},
				refreshToken: {
					type: String,
				},
			},
		],
	},
	{ timestamps: true }
)

UserSchema.statics.findByCredentials = async function (email, plainPW) {
	const user = await this.findOne({ email })
	console.log(user)
	if (user) {
		const isMatch = await bcrypt.compare(plainPW, user.password)
		if (isMatch) return user
		else return null
	} else {
		return null
	}
}
UserSchema.pre("save", async function (next) {
	const user = this
	const plainPW = user.password

	if (user.isModified("password")) {
		user.password = await bcrypt.hash(plainPW, 10)
	}
	next()
})

UserSchema.static("findPopulated", async (id) => {
	const User = await UserModel.findById(id)
	//.populate("posts")
	//.populate("follows")
	return User
})

UserSchema.methods.toJSON = function () {
	const user = this
	const userObject = user.toObject()

	delete userObject.password
	delete userObject.__v

	return userObject
}

module.exports = model("user", UserSchema)
