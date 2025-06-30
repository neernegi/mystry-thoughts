// Updated route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateNewSlides } from "@/lib/slideGenerator";
import dbConnect from "@/lib/dbConnect";
import AiSlide from "@/model/AiSlide";

export async function GET() {
  try {
    await dbConnect();

    // Check if there are current slides (not expired)
    let currentSlides = await AiSlide.findOne()
      .sort({ createdAt: -1 })
      .populate("thoughtId confessionId");

    if (!currentSlides) {
      currentSlides = await generateNewSlides();
      if (currentSlides) {
        await currentSlides.populate("thoughtId confessionId");
      }
    }

    if (!currentSlides) {
      return NextResponse.json(
        { message: "No slides available - please add thoughts or confessions first" },
        { status: 404 }
      );
    }

    return NextResponse.json(currentSlides);
  } catch (error) {
    console.error("Error fetching slides:", error);
    return NextResponse.json(
      { error: "Failed to fetch slides" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await dbConnect();

    // Force generate new slides
    const newSlides = await generateNewSlides();
    
    if (!newSlides) {
      return NextResponse.json(
        { message: "Could not generate slides - please add thoughts or confessions first" },
        { status: 404 }
      );
    }

    await newSlides.populate("thoughtId confessionId");
    return NextResponse.json(newSlides, { status: 201 });
  } catch (error) {
    console.error("Error generating slides:", error);
    return NextResponse.json(
      { error: "Failed to generate slides" },
      { status: 500 }
    );
  }
}