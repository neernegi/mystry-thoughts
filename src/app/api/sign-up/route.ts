import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import bcrypt from "bcryptjs";
import { uploadAvatar } from "@/helpers/cloudinaryHelper";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, email, password, gender, image } = await request.json();

    // Validate required fields
    if (!username || !email || !password) {
      return Response.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    // Set default avatar generation options
    const defaultAvatarOptions = {
      avatarStyle: "Circle",
      topType: gender === "female" ? "LongHairStraight" : "ShortHairShortWaved",
      accessoriesType: "Blank",
      hairColor: "BrownDark",
      facialHairType: "Blank",
      facialHairColor: "Auburn",
      clotheType: "ShirtCrewNeck",
      colorFabric: "Black",
      eyeType: "Side",
      eyebrowType: "Angry",
      mouthType: "Smile",
      skinColor: "Light",
    };

    const params = new URLSearchParams(defaultAvatarOptions);
    const defaultAvatarUrl = `https://avataaars.io/?${params.toString()}`;
    let finalImageUrl = "";

    // Upload custom image if provided, otherwise upload generated avatar
    const imageToUpload = image || defaultAvatarUrl;
    const uploadResult = await uploadAvatar(imageToUpload, username);

    if (uploadResult.success && uploadResult.url) {
      finalImageUrl = uploadResult.url;
      console.log("Avatar uploaded to Cloudinary successfully");
    } else {
      console.error("Avatar upload failed:", uploadResult.error);
      finalImageUrl = defaultAvatarUrl; // fallback to direct URL
    }

    // Check if username is already taken (verified users only)
    const existingUserByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });
    if (existingUserByUsername) {
      return Response.json(
        { success: false, message: "Username is already taken." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUserByEmail = await UserModel.findOne({ email });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return Response.json(
          {
            success: false,
            message: "Email is already registered and verified.",
          },
          { status: 400 }
        );
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Use findByIdAndUpdate for more reliable saving
        const updatedUser = await UserModel.findByIdAndUpdate(
          existingUserByEmail._id,
          {
            $set: {
              password: hashedPassword,
              gender: gender,
              image: finalImageUrl,
              avatarOptions: defaultAvatarOptions,
              verifyCode: verifyCode,
              verifyCodeExpiry: new Date(Date.now() + 3600000),
            },
          },
          {
            new: true,
            runValidators: true,
            upsert: false,
          }
        );

        console.log("Updated user avatarOptions:", updatedUser?.avatarOptions);
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour expiry

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        gender,
        image: finalImageUrl,
        avatarOptions: defaultAvatarOptions,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
      });

      const savedUser = await newUser.save();
      console.log(
        "New user saved with avatarOptions:",
        savedUser.avatarOptions
      );
    }

    // Send verification email
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );
    if (!emailResponse.success) {
      return Response.json(
        {
          success: false,
          message: emailResponse.message,
        },
        { status: 500 }
      );
    }

    // Success
    return Response.json(
      {
        success: true,
        message: "User registered successfully. Please verify your email.",
        user: {
          username,
          email,
          image: finalImageUrl,
          avatarOptions: defaultAvatarOptions,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      {
        success: false,
        message: "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}