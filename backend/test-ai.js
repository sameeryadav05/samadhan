import axios from 'axios';

const HF_TOKEN = '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';

async function testAIMentor() {
  try {
    console.log('🧪 Testing AI Mentor...');
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      { 
        inputs: 'How do I learn JavaScript effectively?',
        parameters: { 
          max_new_tokens: 300, 
          temperature: 0.7,
          return_full_text: false
        } 
      },
      { 
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        timeout: 30000
      }
    );

    console.log('✅ AI Mentor Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ AI Mentor Error:', error.message);
    return false;
  }
}

async function testAIScheduler() {
  try {
    console.log('🧪 Testing AI Scheduler...');
    
    const prompt = `You are an expert study planner. Generate a comprehensive day-wise study schedule.

User Input:
- Learning Goal: learn JavaScript core features
- Subjects: JavaScript
- Deadline: 2025-10-26
- Daily Study Time: 120 minutes

Output ONLY valid JSON with this exact structure:
{
  "schedule": [
    {
      "week": 1,
      "day": "2025-09-26",
      "subject": "JavaScript",
      "focus": "JavaScript Fundamentals",
      "duration": 120
    }
  ]
}

Return only JSON, no extra text.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      { 
        inputs: 'Generate a study schedule for learning JavaScript',
        parameters: { 
          max_new_tokens: 2000, 
          temperature: 0.3,
          return_full_text: false
        } 
      },
      { 
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        timeout: 30000
      }
    );

    console.log('✅ AI Scheduler Response:', response.data);
    return true;
  } catch (error) {
    console.error('❌ AI Scheduler Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting AI Functionality Tests...\n');
  
  const mentorResult = await testAIMentor();
  console.log('');
  
  const schedulerResult = await testAIScheduler();
  console.log('');
  
  if (mentorResult && schedulerResult) {
    console.log('🎉 All AI tests passed! Both mentor and scheduler are working.');
  } else {
    console.log('⚠️ Some tests failed. Check the errors above.');
  }
}

runTests();
