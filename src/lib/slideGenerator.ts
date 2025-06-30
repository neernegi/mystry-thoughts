// Updated slideGenerator.ts
import { generateKeyTerms, generateAIFeatures } from './gemini';
import AiSlide from '@/model/AiSlide';
import ThoughtModel from '@/model/thoughts';
import dbConnect from './dbConnect';

export async function generateNewSlides() {
  await dbConnect();
  
  // Get random thought and confession
  const thoughtsCount = await ThoughtModel.countDocuments({ type: 'thought' });
  const confessionsCount = await ThoughtModel.countDocuments({ type: 'confession' });
  
  // If no thoughts or confessions, return null or default slides
  if (thoughtsCount === 0 && confessionsCount === 0) {
    return null;
  }

  // Prepare variables
  let selectedThought = null;
  let selectedConfession = null;
  let thoughtKeyTerms = { keyTerms: [] };
  let confessionKeyTerms = { keyTerms: [] };
  let thoughtFeatures = [];
  let confessionFeatures = [];

  // Only process if available
  if (thoughtsCount > 0) {
    const randomThoughtIndex = Math.floor(Math.random() * thoughtsCount);
    [selectedThought] = await ThoughtModel.find({ type: 'thought' }).skip(randomThoughtIndex).limit(1);
    thoughtKeyTerms = await generateKeyTerms(selectedThought.content, 'thought');
    thoughtFeatures = await generateAIFeatures(selectedThought.content, 'thought');
  }

  if (confessionsCount > 0) {
    const randomConfessionIndex = Math.floor(Math.random() * confessionsCount);
    [selectedConfession] = await ThoughtModel.find({ type: 'confession' }).skip(randomConfessionIndex).limit(1);
    confessionKeyTerms = await generateKeyTerms(selectedConfession.content, 'confession');
    confessionFeatures = await generateAIFeatures(selectedConfession.content, 'confession');
  }

  // Create slides only for available content
  const slides = [];
  
  if (thoughtsCount > 0) {
    slides.push(
      {
        title: "Today's Thought",
        type: 'thought',
        keyTerms: thoughtKeyTerms.keyTerms,
        aiFeatures: thoughtFeatures.slice(0, 2)
      },
      {
        title: "Thought Insights",
        type: 'thought',
        keyTerms: thoughtKeyTerms.keyTerms,
        aiFeatures: thoughtFeatures.slice(2, 4)
      }
    );
  }

  if (confessionsCount > 0) {
    slides.push(
      {
        title: "Today's Confession",
        type: 'confession',
        keyTerms: confessionKeyTerms.keyTerms,
        aiFeatures: confessionFeatures.slice(0, 2)
      },
      {
        title: "Confession Analysis",
        type: 'confession',
        keyTerms: confessionKeyTerms.keyTerms,
        aiFeatures: confessionFeatures.slice(2, 4)
      }
    );
  }

  // If no slides could be generated, return null
  if (slides.length === 0) {
    return null;
  }

  // Save to database
  const aiSlide = new AiSlide({
    thoughtId: selectedThought?._id,
    confessionId: selectedConfession?._id,
    slides: slides
  });
  
  await aiSlide.save();
  return aiSlide;
}